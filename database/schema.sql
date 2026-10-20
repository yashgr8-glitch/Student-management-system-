CREATE DATABASE IF NOT EXISTS student_management;
USE student_management;

CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    phone VARCHAR(30) DEFAULT NULL,
    age INT NOT NULL DEFAULT 18,
    department_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_department FOREIGN KEY (department_id)
      REFERENCES departments(id) ON UPDATE CASCADE ON DELETE SET NULL
);

INSERT IGNORE INTO departments(name) VALUES
 ('Computer Science'), ('Electronics'), ('Mechanical'), ('Civil'), ('Information Technology');

INSERT IGNORE INTO students(name,email,phone,age,department_id) VALUES
 ('Aarav Sharma','aarav@example.com','9876543210',20,1),
 ('Ananya Verma','ananya@example.com','9876543211',21,2),
 ('Rohan Gupta','rohan@example.com','9876543212',19,3),
 ('Priya Singh','priya@example.com','9876543213',20,5),
 ('Kabir Mehta','kabir@example.com','9876543214',22,1);

-- Practice queries
SELECT s.id, s.name, s.email, s.age, d.name AS department
FROM students s LEFT JOIN departments d ON d.id=s.department_id;
SELECT * FROM students WHERE age >= 20 ORDER BY name;
SELECT d.name, COUNT(s.id) AS student_count FROM departments d
LEFT JOIN students s ON s.department_id=d.id GROUP BY d.id,d.name;
