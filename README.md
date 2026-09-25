# CodeCraftHub

CodeCraftHub is a Spring Boot REST API for managing developer courses. Course data is stored in a local `courses.json` file.

## Features

- Create, read, update, and delete courses
- JSON file-based persistence
- Automatic course ID generation
- Automatic creation timestamps
- Input validation
- Course status tracking
- RESTful API endpoints

## Technology Stack

- Java 17+
- Spring Boot
- Spring Web
- Jackson
- Maven

## Project Structure

```text
codecrafthub/
├── courses.json
├── pom.xml
├── README.md
└── src/
    └── main/
        ├── java/
        │   └── com/
        │       └── example/
        │           └── codecrafthub/
        │               ├── CodeCraftHubApplication.java
        │               ├── Course.java
        │               ├── CourseController.java
        │               └── CourseService.java
        └── resources/
            └── application.properties
Prerequisites
Install the following:

Java Development Kit 17 or newer
Maven 3.9 or newer
Check the installed versions:

java -version
mvn -version
Installation
Clone the repository:

git clone https://github.com/YOUR_GITHUB_USERNAME/codecrafthub.git
cd codecrafthub
Initialize the data file if it does not already exist:

[]
Save this content as:

courses.json
Build the Project
mvn clean package
To skip tests:

mvn clean package -DskipTests
Run the Application
Run with Maven:

mvn spring-boot:run
Or run the packaged JAR:

java -jar target/codecrafthub-0.0.1-SNAPSHOT.jar
The application runs at:

http://localhost:8080
The API base URL is:

http://localhost:8080/api/courses
API Endpoints
Method	Endpoint	Description
GET
/api/courses
Get all courses
GET
/api/courses/{id}
Get a course by ID
POST
/api/courses
Create a course
PUT
/api/courses/{id}
Update a course
DELETE
/api/courses/{id}
Delete a course
Course Object
{
  "id": 1,
  "name": "Spring Boot REST APIs",
  "description": "Learn how to build REST APIs with Spring Boot.",
  "target_date": "2026-12-31",
  "status": "Not Started",
  "created_at": "2026-09-25T14:30:00Z"
}
Create a Course
curl -X POST http://localhost:8080/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spring Boot REST APIs",
    "description": "Learn how to build REST APIs with Spring Boot.",
    "target_date": "2026-12-31",
    "status": "Not Started"
  }'
Get All Courses
curl http://localhost:8080/api/courses
Get a Course by ID
curl http://localhost:8080/api/courses/1
Update a Course
curl -X PUT http://localhost:8080/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced Spring Boot REST APIs",
    "description": "Build production-style REST APIs with Spring Boot.",
    "target_date": "2027-01-15",
    "status": "In Progress"
  }'
Delete a Course
curl -X DELETE http://localhost:8080/api/courses/1
Validation Rules
Required fields:

name
description
target_date
status
Valid status values:

Not Started
In Progress
Completed
The
target_date
must use this format:

YYYY-MM-DD
Example:

2026-12-31
Data Storage
Course information is stored in:

courses.json
The application creates this file automatically if it does not exist.

This file-based storage approach is intended for educational and small personal projects. A production application should use a database.

Troubleshooting
Port 8080 Is Already in Use
Add the following to:

src/main/resources/application.properties
server.port=8081
The application will then run at:

http://localhost:8081
Invalid JSON
Stop the application and replace the contents of
courses.json
with:

[]
Rebuild the Application
mvn clean package
mvn spring-boot:run
License
This project is intended for educational and personal use. '@ | Set-Content -Path "README.md" -Encoding UTF8