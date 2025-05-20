# NgRx Multi-Module Authentication Example

## Application Overview

This example application, "AdminPortal," demonstrates how to implement shared state management across multiple Angular modules using NgRx. The application is designed as an administrative portal that sets different users with different permission levels to access various sections of the system.

### Features

- **User Authentication**: Complete login flow with JWT token storage
- **Role-Based Access Control**: Different views and capabilities based on user roles
- **Admin Dashboard**: Administrative interface for user management
- **User Dashboard**: Personal dashboard for regular users
- **Secure API Communication**: Automatically handles authentication headers

### User Roles and Permissions

The application supports multiple user roles:

- **Admin**: Can access all areas including user management
- **Manager**: Can access dashboards and limited administrative functions
- **User**: Can only access their profile and dashboard

### Module Structure

The application is organized into several feature modules:

1. **Auth Module**: Handles login, registration, and password reset
2. **Dashboard Module**: Contains the main user interface after login
3. **Admin Module**: Provides administrative tools for user management
4. **Shared Module**: Contains common components, directives, and pipes
5. **Core Module**: Houses services, guards, and interceptors

### Technical Implementation

- Angular 15+
- NgRx for state management
- RxJS for reactive programming
- Lazy loading for improved performance
- Unit tests with JEST

## State Management Architecture

The application uses NgRx to maintain a shared state across different modules and components. This ensures consistent user experience and data integrity throughout the application.

### State Structure

The application's state is organized into feature slices:

```
AppState
├── user
│   ├── currentUser
│   ├── isAuthenticated
│   ├── loading
│   └── error
├── users (admin module)
│   ├── entities
│   ├── loading
│   └── error
└── settings
    ├── theme
    ├── notifications
    └── language
```

Each feature slice manages its data, loading states, and errors, providing a clean separation of concerns.

### Data Flow 

Data flows through the application in a unidirectional pattern:

1. **User Interaction**: User interacts with a component (e.g., clicks login button)
2. **Action Dispatch**: Component dispatches an action (e.g., `login`)
3. **Effect Processing**: Effects intercept actions that require side effects
4. **API Interaction**: Effects make API calls through services
5. **Result Actions**: Effects dispatch success or failure actions with results
6. **State Update**: Reducers handle these actions and update the state
7. **UI Update**: Components receive updated state through selectors and update the UI

This predictable data flow makes the application easier to debug and maintain.

## User Stories

To illustrate how the application works, consider these user stories:

1. **User Login**: 
   - Sarah enters her credentials on the login page
   - After successful authentication, she's redirected to her dashboard
   - Her user profile appears in the header across all pages

2. **Admin User Management**:
   - John (an admin) logs in and navigates to the admin panel
   - He sees a list of all users in the system
   - He can edit user details or change permissions
   - Changes are immediately reflected throughout the application

3. **Profile Update**:
   - Mark updates his profile picture and name
   - The new information is immediately visible in the header and sidebar
   - When he navigates to different sections, his updated profile persists

These stories highlight how a shared state creates a consistent experience across the application.

## Development Considerations

When building this application, several considerations were made:

- **Performance**: Using selectors with memoization to prevent unnecessary re-renders
- **Security**: Implementing proper authentication guards and HTTP interceptors
- **Testability**: Creating pure functions (reducers and selectors) that are easy to test
- **Maintainability**: Organizing code into feature modules with clear responsibilities
- **Scalability**: Designing the state architecture to accommodate future growth

This architecture provides a solid foundation that can be extended with additional features while maintaining a clean, maintainable codebase.
