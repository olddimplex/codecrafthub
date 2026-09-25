package com.example.codecrafthub;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller exposing the course API.
 */
@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    /**
     * POST /api/courses
     *
     * Creates a new course.
     */
    @PostMapping
    public ResponseEntity<Course> createCourse(
            @RequestBody Course course
    ) {
        Course createdCourse = courseService.createCourse(course);

        URI location = URI.create(
                "/api/courses/" + createdCourse.getId()
        );

        return ResponseEntity
                .created(location)
                .body(createdCourse);
    }

    /**
     * GET /api/courses
     *
     * Returns all courses.
     */
    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    /**
     * GET /api/courses/{id}
     *
     * Returns one course by its numeric ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    /**
     * PUT /api/courses/{id}
     *
     * Replaces the editable fields of an existing course.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(
            @PathVariable Long id,
            @RequestBody Course course
    ) {
        Course updatedCourse = courseService.updateCourse(id, course);

        return ResponseEntity.ok(updatedCourse);
    }

    /**
     * DELETE /api/courses/{id}
     *
     * Deletes a course.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(
            @PathVariable Long id
    ) {
        courseService.deleteCourse(id);

        return ResponseEntity.noContent().build();
    }

    /**
     * Handles missing required fields.
     */
    @ExceptionHandler(CourseService.InvalidCourseException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCourse(
            CourseService.InvalidCourseException exception
    ) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                exception.getMessage()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(error);
    }

    /**
     * Handles requests for courses that do not exist.
     */
    @ExceptionHandler(CourseService.CourseNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCourseNotFound(
            CourseService.CourseNotFoundException exception
    ) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                exception.getMessage()
        );

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(error);
    }

    /**
     * Handles file read and write errors.
     */
    @ExceptionHandler(CourseService.CourseFileException.class)
    public ResponseEntity<ErrorResponse> handleFileError(
            CourseService.CourseFileException exception
    ) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                exception.getMessage()
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error);
    }

    /**
     * Handles malformed JSON, invalid dates, and invalid status values.
     *
     * For example, this request is invalid:
     *
     * {
     *   "status": "Started"
     * }
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleInvalidJson(
            HttpMessageNotReadableException exception
    ) {
        String message = "Request contains invalid JSON";

        Throwable cause = exception.getMostSpecificCause();

        if (cause instanceof IllegalArgumentException) {
            message = cause.getMessage();
        }

        if (cause instanceof InvalidFormatException invalidFormatException) {
            Class<?> targetType = invalidFormatException.getTargetType();

            if (targetType.equals(LocalDate.class)) {
                message = "target_date must use the format YYYY-MM-DD";
            } else if (targetType.equals(Course.CourseStatus.class)) {
                message = "status must be exactly one of: " +
                        "\"Not Started\", \"In Progress\", or \"Completed\"";
            }
        }

        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                message
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(error);
    }

    /**
     * Handles invalid numeric IDs such as /api/courses/abc.
     */
    @ExceptionHandler(NumberFormatException.class)
    public ResponseEntity<ErrorResponse> handleInvalidId(
            NumberFormatException exception
    ) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Course ID must be a number"
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(error);
    }

    /**
     * Simple JSON error response.
     */
    public record ErrorResponse(
            int status,
            String message
    ) {
    }
}