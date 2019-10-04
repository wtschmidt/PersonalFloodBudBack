DROP DATABASE IF EXISTS floodbud;

CREATE DATABASE floodbud;

\c floodbud;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firstName varchar(50),
  lastName varchar(50),
  email varchar(50)
);

CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  location varchar(255),
  img varchar(255),
  descr varchar(255)
);

/*  Execute this file from the command line by typing:
 *    psql postgres -U postgres < schema.sql
 *  to create the database and the tables.*/