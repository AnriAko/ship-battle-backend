# Ship battle future project

### To start project

git clone git@github.com:AnriAko/ship-battle-backend.git
cd ship-battle-backend
npm install

If you have docker:
docker-compose up -d

If don't have docker need to run mongodb locally on port 27017

npm run start

### Swagger:

http://localhost:3000/api/docs

### Routes done:

Get all users
GET /api/user

Registration
POST /api/auth/signup

Login
POST /api/auth/signin

Update user Data
PATCH /api/auth/update
