import {pgTable, serial, varchar, integer} from 'drizzle-orm/pg-core';

export const santri = pgTable('santri', {
    id: serial('id').primaryKey(),
    name: varchar('name', {length: 256}).notNull(),
    gender: varchar('gender', {length: 256}).notNull(),
    hafalan: integer('hafalan').default(0),
    wali: varchar('wali', {length: 256}).notNull(),
});

export const admins = pgTable('admins', {
    id: serial('id').primaryKey(),
    username: varchar('username', {length: 256}).notNull().unique(),
    password: varchar('password', {length: 256}).notNull(),
});

