"use server";
import { UpdateRequestStatusProps } from "./UpdateTravelStatus";
import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import { ITEmailSender } from "@/services/ITEmailSender";

export async function UpdateITRequisitionStatus(
  payload: UpdateRequestStatusProps,
): Promise<AlertInfo> {}
