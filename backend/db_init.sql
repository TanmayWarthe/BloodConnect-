-- ============================================================
-- BloodConnect – Database Initialisation Script
-- Run this ONCE as a MySQL root user before starting the backend:
--   mysql -u root -p < backend/db_init.sql
--
-- After this, start the Spring Boot app with:
--   mvn spring-boot:run
-- Hibernate (ddl-auto=update) will auto-create / migrate all
-- tables: users, donors, patients, hospitals, donations,
--         appointments, blood_requests, inventory, notifications
-- ============================================================

CREATE DATABASE IF NOT EXISTS bloodconnect
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Optional: grant the app user the right permissions
-- (change 'root'@'localhost' to your actual DB user if different)
GRANT ALL PRIVILEGES ON bloodconnect.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

USE bloodconnect;

-- The tables below are created automatically by Hibernate on first
-- boot.  They are shown here as reference only — you do NOT need to
-- run them manually unless ddl-auto is set to 'none'.

-- users
-- CREATE TABLE IF NOT EXISTS users (
--   id         BIGINT AUTO_INCREMENT PRIMARY KEY,
--   name       VARCHAR(255) NOT NULL,
--   email      VARCHAR(255) NOT NULL UNIQUE,
--   password   VARCHAR(255) NOT NULL,
--   role       ENUM('DONOR','PATIENT','HOSPITAL','ADMIN') NOT NULL,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- );

-- donors
-- CREATE TABLE IF NOT EXISTS donors (
--   id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
--   user_id             BIGINT UNIQUE,
--   name                VARCHAR(255),
--   blood_group         VARCHAR(10),
--   rh_factor           VARCHAR(20),
--   dob                 DATE,
--   gender              VARCHAR(20),
--   phone               VARCHAR(20),
--   address             TEXT,
--   latitude            DOUBLE,
--   longitude           DOUBLE,
--   last_donation_date  DATE,
--   availability_status ENUM('AVAILABLE','BUSY','UNAVAILABLE') DEFAULT 'AVAILABLE',
--   FOREIGN KEY (user_id) REFERENCES users(id)
-- );

-- patients
-- CREATE TABLE IF NOT EXISTS patients (
--   id          BIGINT AUTO_INCREMENT PRIMARY KEY,
--   user_id     BIGINT UNIQUE,
--   name        VARCHAR(255),
--   blood_group VARCHAR(10),
--   dob         DATE,
--   phone       VARCHAR(20),
--   address     TEXT,
--   disease     VARCHAR(255),
--   FOREIGN KEY (user_id) REFERENCES users(id)
-- );

-- hospitals
-- CREATE TABLE IF NOT EXISTS hospitals (
--   id              BIGINT AUTO_INCREMENT PRIMARY KEY,
--   user_id         BIGINT UNIQUE,
--   hospital_name   VARCHAR(255),
--   license_number  VARCHAR(100),
--   phone           VARCHAR(20),
--   address         TEXT,
--   latitude        DOUBLE,
--   longitude       DOUBLE,
--   FOREIGN KEY (user_id) REFERENCES users(id)
-- );

-- (remaining tables — donations, appointments, blood_requests,
--  inventory, notifications — are also auto-created by Hibernate)
