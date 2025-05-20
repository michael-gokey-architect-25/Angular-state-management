// This example demonstrates NgRx for shared state across multiple modules in Angular
// We'll create a simple user authentication state that's shared across the application

// Step 1: Define the state interface and initial state
// File: src/app/state/user/user.state.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const initialUserState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

// Step 2: Define actions
// File: src/app/state/user/user.actions.ts
import { createAction, props } from '@ngrx/store';
import { User } from './user.state';

export const login = createAction(
  '[Auth] Login',
  props<{ username: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const logout = createAction('[Auth] Logout');
export const logoutSuccess = createAction('[Auth] Logout Success');

export const getUserProfile = createAction('[User] Get User Profile');
export const getUserProfileSuccess = createAction(
  '[User] Get User Profile Success',
  props<{ user: User }>()
);

// Step 3: Create a reducer
// File: src/app/state/user/user.reducer.ts
import { createReducer, on } from '@ngrx/store';
import * as UserActions from './user.actions';
import { initialUserState, UserState } from './user.state';

export const userReducer = createReducer(
  initialUserState,
  
  on(UserActions.login, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(UserActions.loginSuccess, (state, { user }) => ({
    ...state,
    currentUser: user,
    isAuthenticated: true,
    loading: false,
    error: null
  })),
  
  on(UserActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  on(UserActions.logout, (state) => ({
    ...state,
    loading: true
  })),
  
  on(UserActions.logoutSuccess, () => ({
    ...initialUserState
  })),
  
  on(UserActions.getUserProfile, (state) => ({
    ...state,
    loading: true
  })),
  
  on(UserActions.getUserProfileSuccess, (state, { user }) => ({
    ...state,
    currentUser: user,
    loading: false
  }))
);

// Step 4: Create selectors
// File: src/app/state/user/user.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState } from './user.state';

export const selectUserState = createFeatureSelector<UserState>('user');

export const selectCurrentUser = createSelector(
  selectUserState,
  (state: UserState) => state.currentUser
);

export const selectIsAuthenticated = createSelector(
  selectUserState,
  (state: UserState) => state.isAuthenticated
);

export const selectUserLoading = createSelector(
  selectUserState,
  (state: UserState) => state.loading
);

export const selectUserError = createSelector(
  selectUserState,
  (state: UserState) => state.error
);

export const selectUserRole = createSelector(
  selectCurrentUser,
  (user) => user?.role
);

// Step 5: Create effects
// File: src/app/state/user/user.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import * as UserActions from './user.actions';
import { Router } from '@angular/router';

@Injectable()
export class UserEffects {
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.login),
      mergeMap(({ username, password }) =>
        this.authService.login(username, password).pipe(
          map((user) => UserActions.loginSuccess({ user })),
          catchError((error) => of(UserActions.loginFailure({ error: error.message })))
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UserActions.loginSuccess),
        tap(() => {
          this.router.navigate(['/dashboard']);
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.logout),
      mergeMap(() =>
        this.authService.logout().pipe(
          map(() => UserActions.logoutSuccess()),
          catchError(() => of(UserActions.logoutSuccess())) // Always logout even if API fails
        )
      )
    )
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UserActions.logoutSuccess),
        tap(() => {
          this.router.navigate(['/login']);
        })
      ),
    { dispatch: false }
  );

  getUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.getUserProfile),
      mergeMap(() =>
        this.authService.getCurrentUser().pipe(
          map((user) => UserActions.getUserProfileSuccess({ user })),
          catchError((error) => of(UserActions.loginFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private router: Router
  ) {}
}

// Step 6: Define the auth service used by effects
// File: src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../../state/user/user.state';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'api/auth';
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<User> {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
      }),
      map(response => response.user),
      catchError(error => throwError(() => new Error('Invalid credentials')))
    );
  }

  logout(): Observable<void> {
    localStorage.removeItem(this.tokenKey);
    return of(void 0);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      catchError(error => throwError(() => new Error('Failed to fetch user profile')))
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}

// Step 7: Set up the Root State and register in the App Module
// File: src/app/state/app.state.ts
import { UserState } from './user/user.state';

export interface AppState {
  user: UserState;
  // other state slices can be added here
}

// File: src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { userReducer } from './state/user/user.reducer';
import { UserEffects } from './state/user/user.effects';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    StoreModule.forRoot({ user: userReducer }),
    EffectsModule.forRoot([UserEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
    })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

// Step 8: Create an auth interceptor to handle authentication headers
// File: src/app/core/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return next.handle(request);
  }
}

// Step 9: Create a Feature Module that uses the shared state
// File: src/app/features/admin/admin.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { UserListComponent } from './components/user-list/user-list.component';
// We don't need to import user reducer here since it's in the root store

@NgModule({
  declarations: [AdminDashboardComponent, UserListComponent],
  imports: [
    CommonModule,
    AdminRoutingModule
    // No additional StoreModule.forFeature() needed for the shared user state
  ]
})
export class AdminModule {}

// Step 10: Create a component in the Admin module that uses the shared state
// File: src/app/features/admin/components/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../state/app.state';
import { User } from '../../../../state/user/user.state';
import { selectCurrentUser, selectIsAuthenticated, selectUserRole } from '../../../../state/user/user.selectors';
import { logout } from '../../../../state/user/user.actions';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div *ngIf="isAuthenticated$ | async; else notAuthenticated">
        <div *ngIf="currentUser$ | async as user">
          <h2>Welcome, {{ user.name }}</h2>
          <p>Role: {{ userRole$ | async }}</p>
        </div>
        
        <button (click)="onLogout()">Logout</button>
      </div>
      
      <ng-template #notAuthenticated>
        <p>You are not authenticated. Please log in.</p>
      </ng-template>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  currentUser$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;
  userRole$: Observable<string | undefined>;

  constructor(private store: Store<AppState>) {
    this.currentUser$ = this.store.select(selectCurrentUser);
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
    this.userRole$ = this.store.select(selectUserRole);
  }

  ngOnInit(): void {
    // Component is using the existing state, no need to dispatch additional actions
  }

  onLogout(): void {
    this.store.dispatch(logout());
  }
}

// Step 11: Create another Feature Module (Dashboard) that also uses the shared state
// File: src/app/features/dashboard/dashboard.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';

@NgModule({
  declarations: [DashboardComponent, UserProfileComponent],
  imports: [
    CommonModule,
    DashboardRoutingModule
  ]
})
export class DashboardModule {}

// Step 12: Create a component in the Dashboard module that uses the shared state
// File: src/app/features/dashboard/components/user-profile/user-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../state/app.state';
import { User } from '../../../../state/user/user.state';
import { selectCurrentUser, selectUserLoading } from '../../../../state/user/user.selectors';
import { getUserProfile } from '../../../../state/user/user.actions';

@Component({
  selector: 'app-user-profile',
  template: `
    <div class="user-profile">
      <h2>User Profile</h2>
      
      <div *ngIf="loading$ | async">
        Loading profile...
      </div>
      
      <div *ngIf="(currentUser$ | async) as user; else noUser">
        <div class="profile-info">
          <p><strong>Name:</strong> {{ user.name }}</p>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Role:</strong> {{ user.role }}</p>
        </div>
      </div>
      
      <ng-template #noUser>
        <p *ngIf="!(loading$ | async)">No user profile available.</p>
      </ng-template>
      
      <button (click)="refreshProfile()">Refresh Profile</button>
    </div>
  `
})
export class UserProfileComponent implements OnInit {
  currentUser$: Observable<User | null>;
  loading$: Observable<boolean>;

  constructor(private store: Store<AppState>) {
    this.currentUser$ = this.store.select(selectCurrentUser);
    this.loading$ = this.store.select(selectUserLoading);
  }

  ngOnInit(): void {
    this.refreshProfile();
  }

  refreshProfile(): void {
    this.store.dispatch(getUserProfile());
  }
}

// Step 13: Create an Auth Module with login component
// File: src/app/features/auth/auth.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './components/login/login.component';

@NgModule({
  declarations: [LoginComponent],
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule
  ]
})
export class AuthModule {}

// Step 14: Create a login component that dispatches login action
// File: src/app/features/auth/components/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../state/app.state';
import { login } from '../../../../state/user/user.actions';
import { selectUserError, selectUserLoading } from '../../../../state/user/user.selectors';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-container">
      <h2>Login</h2>
      
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            formControlName="username"
            [class.is-invalid]="username.invalid && (username.dirty || username.touched)"
          >
          <div *ngIf="username.invalid && (username.dirty || username.touched)" class="error-message">
            <div *ngIf="username.errors?.['required']">Username is required</div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            formControlName="password"
            [class.is-invalid]="password.invalid && (password.dirty || password.touched)"
          >
          <div *ngIf="password.invalid && (password.dirty || password.touched)" class="error-message">
            <div *ngIf="password.errors?.['required']">Password is required</div>
          </div>
        </div>
        
        <div *ngIf="error$ | async as error" class="alert alert-danger">
          {{ error }}
        </div>
        
        <button type="submit" [disabled]="loginForm.invalid || (loading$ | async)">
          <span *ngIf="loading$ | async">Logging in...</span>
          <span *ngIf="!(loading$ | async)">Login</span>
        </button>
      </form>
    </div>
  `
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    
    this.loading$ = this.store.select(selectUserLoading);
    this.error$ = this.store.select(selectUserError);
  }

  ngOnInit(): void {}

  get username() {
    return this.loginForm.get('username')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      this.store.dispatch(login({ username, password }));
    }
  }
}

// Step 15: Create an auth guard for protected routes
// File: src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AppState } from '../../state/app.state';
import { selectIsAuthenticated } from '../../state/user/user.selectors';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.store.select(selectIsAuthenticated).pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        }
        return this.router.createUrlTree(['/login']);
      })
    );
  }
}

// Step 16: Create a role guard for admin routes
// File: src/app/core/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AppState } from '../../state/app.state';
import { selectUserRole } from '../../state/user/user.selectors';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.store.select(selectUserRole).pipe(
      take(1),
      map(role => {
        if (role === 'admin') {
          return true;
        }
        return this.router.createUrlTree(['/dashboard']);
      })
    );
  }
}

// Step 17: Set up routing with guards
// File: src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard, RoleGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}



