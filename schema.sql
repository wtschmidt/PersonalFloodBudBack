DROP DATABASE IF EXISTS floodbud;

CREATE DATABASE floodbud;

\c floodbud;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firstName varchar(50),
  lastName varchar(50),
  googleId varchar(100) UNIQUE,
  username varchar(100),
);

CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  latLng varchar(255),
  img varchar(255),
  description varchar(255),
  physical_address varchar(255),
  user_id INTEGER REFERENCES users (id)
);

CREATE TABLE emergencyContacts(
  id SERIAL PRIMARY KEY,
  phone_number varchar(20),
  name varchar(50),
  user_id INTEGER REFERENCES users (id)
);


CREATE TABLE rainGauge( 
  id SERIAL PRIMARY KEY,
  gaugeInfo varchar(255),
  user_id INTEGER REFERENCES users (id)
);

CREATE TABLE rainGaugeReports(
  id SERIAL PRIMARY KEY,
  gauge_location varchar(255),
  time varchar(25),
  gauge_id INTEGER REFERENCES rainGauge (id)
);


/*  Execute this file from the command line by typing:
 *    psql postgres -U postgres < schema.sql
 *  to create the database and the tables.*/