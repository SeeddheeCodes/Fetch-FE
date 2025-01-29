# Fetch Dogs Frontend Application

## Overview
A React-based frontend application for browsing and interacting with dog data, featuring secure authentication and API integration.



## Project Setup

### Prerequisites
- Node.js (v16+ recommended)
- npm (v8+)
- Git
- Modern web browser

### Installation

1. Clone the repository:

git clone https://github.com/seeddhee/fetch-dogs.git
cd fetch-dogs


2. Install dependencies:
npm install


### Running the Application

#### Development Mode

npm start
- Application will run on `http://localhost:3000`
- Hot reloading enabled

npm run build
- Generates optimized production build
- Output in `build/` directory

## API Authentication

### Login Process
- Endpoint: `/auth/login`
- Method: POST
- Required Fields:
  - `name`: User's full name
  - `email`: Valid email address

#### Example Login Request
{
"name": "John Doe",
"email": "johndoe@example.com"
}



## Testing
- Jest and React Testing Library used
- Run tests with `npm test`
- Coverage reports generated

## Deployment
- Recommended Platforms:
  - Netlify
  - Vercel
  - AWS Amplify
- Ensure environment variables are configured

## Troubleshooting

### Common Issues
1. Authentication Failures
   - Check network connectivity
   - Verify credentials
   - Clear browser cookies

2. Dependency Problems
   - Run `npm install`
   - Update npm: `npm install -g npm@latest`

3. Build Errors
   - Ensure Node.js and npm are updated
   - Remove `node_modules` and reinstall

## Contributing
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create pull request

### Contribution Guidelines
- Follow existing code style
- Write tests for new features
- Update documentation

## Security
- All API requests use secure, httpOnly cookies
- CSRF protection implemented
- Credentials sent only via HTTPS

## License
MIT License - See LICENSE file for details

## Contact
- Project Maintainer: Siddhi Kulkarni
- Email: seeddhee@gmail.com
- GitHub: @SeeddheeCodes

---

**Happy Coding! 🐶🚀**
