
# Term Project

Add design docs in _images/_

## Instructions to setup and run project

Clearly explain the steps required to install and configure necessary packages,
for both the server and the client, and the sequence of steps required to get
your application running.

STEPS TO USE THE PROJECT!!:

- Have Four Terminals Running
- First terminal run: mongod
- Second terminal run: mongosh
- Third terminal run: cd server
- Third terminal run: npm install
- Third terminal run: node init.js mongodb://localhost:27017/phreddit
- Third terminal run: node server.js
- Fourth terminal: cd client
- Fourth terminal: npm install
- Fourth terminal: npm start
- Credentials for admin should be in console but it's admin@admin.com:password123
- To test other users simply open the db and go to users (i use mongodb compass) and use their emailaddress:password123
- They are randomly generated each time you run init.js so just be aware.
- FOR TESTING: make sure server and client are running like above
- in a new terminal run cd server then run npm test
- in a new terminal run cd client then run npm test

In the sections below, list and describe each contribution briefly.

## Team Member 1 Contribution

Ian Kaufman 115639955

- Completed cases 2 and 3 which were the login and logout options. 04/19/25

-Completed cases 6 and 7 which involved the functionality changes to the NavBar. 04/22/2025

-Completed Leave and Join for Community
04/24/2025

-Fixed SortCommunities 04/25/2025

- Added vote features and did 16/17 for post detail view
  04/30/2025

- Added the features for UserProfileView to delete and hold each users individual posts, comments, and communities.

- Successfully implemented the delete, userProfile link, and edit features.

- Completed the impersonate feature and fixed admin as well as fixed cancel feature for deleting.
  05/06/2025

- Fixed Community error where posts weren't also deleted
  05/08/2025

-Fixed bugs
05/09/2025

-Votes fix
05/11/202

## Team Member 2 Contribution

Zaber Jamal 115458420

- Created the html and css of the welcome page (login prompt) 04/17/2025
- Created the functionality of signup backend, created the user routes and user database schema 04/17/2025
- Created banner
- Created init.js which generates fake data, fake users, fake information. All users have "password123" as their password. Users can be in random communities and they can create communites and posts. (please run npm install in server directory before running it) 04/23/2025
- Fixed search bar to seperate joined communities and non joined 04/25/2025
- New post page, new comment page, reply comment all work 04/28/2025
- Finished all UML diagrams for project 05/09/2025