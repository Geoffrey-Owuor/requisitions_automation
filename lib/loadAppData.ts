"use server";
import fs from "fs/promises";
import path from "path";

export interface ApproversObject {
  name: string;
  email: string;
  uuid: string;
}

// FUNCTIONS FOR LOADING DATA FROM JSON FILES

// Base Departments
export async function loadBaseDepartments(): Promise<string[]> {
  const filePath = path.join(process.cwd(), "data", "base-departments.json");

  const fileContents = await fs.readFile(filePath, "utf8");

  return JSON.parse(fileContents);
}

// Hod Approvers
export async function loadHodApprovers(): Promise<string[]> {
  const filePath = path.join(process.cwd(), "data", "hod-approvers.json");

  const fileContents = await fs.readFile(filePath, "utf8");

  return JSON.parse(fileContents);
}

// Hod Array
export async function loadHodArray(): Promise<ApproversObject[]> {
  const filePath = path.join(process.cwd(), "data", "hod-array.json");

  const fileContents = await fs.readFile(filePath, "utf8");

  return JSON.parse(fileContents);
}

// Hr Array
export async function loadHrArray(): Promise<ApproversObject[]> {
  const filePath = path.join(process.cwd(), "data", "hr-array.json");

  const fileContents = await fs.readFile(filePath, "utf8");

  return JSON.parse(fileContents);
}

// IT Array
export async function loadITArray(): Promise<ApproversObject[]> {
  const filePath = path.join(process.cwd(), "data", "it-array.json");

  const fileContents = await fs.readFile(filePath, "utf8");

  return JSON.parse(fileContents);
}

// Director Array
export async function loadDirectorArray(): Promise<ApproversObject[]> {
  const filePath = path.join(process.cwd(), "data", "director-array.json");

  const fileContents = await fs.readFile(filePath, "utf8");

  return JSON.parse(fileContents);
}
