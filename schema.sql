DROP DATABASE IF EXISTS floodbud;

CREATE DATABASE floodbud;

\c floodbud;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firstName varchar(50),
  lastName varchar(50),
  email varchar(50),
  password varchar(50),
  phone_number varchar(20)
);

CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  location varchar(255),
  img varchar(255),
  description varchar(255),
  location varchar(255),
  elevation varchar(255),
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
  location varchar(255),
  time varchar(25),
  gauge_id INTEGER REFERENCES rainGauge (id)
);


/*  Execute this file from the command line by typing:
 *    psql postgres -U postgres < schema.sql
 *  to create the database and the tables.*/