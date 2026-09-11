<!-- File to define proposed changes to features and logic within the project -->

# Proposed Changes to the Casual Requisition Workflow

This file documents the proposed changes to the casual requisition workflow

## Budget spend estimates

- Each department has monthly allocated budgets.
- We currently have a budget spend to date for specific departments (Existing spend before the system was launched).
- For the operations department, the budget is divided into two: (warehouse (all operations sections except Bond) and bonded warehouse (The Bond section) - meaning for the operations department, if one of the selected sections is Bond, the bond budget and spend will also be included alongside the other selected sections, if only bond section is selected, we only show the budget spend for that.
- Ideally, based on the submitted casual requisition sections and the selected department, the goal is to show the submitter and overview of their spend (Their monthly budget against spend to date - Months that have passed - financial year is from April to March, which also shows the difference, then we also show the yearly overall budget against the overall current yearly spend).
- Spend will be derived from past submitted requisition sections as well as the current spend to date before the system was launched (All spending data amounts is in kenyan shillings and should live on the database side).
- This information will ideally be displayed in the second confirmation step after the title right before the user submits (Spend estimate will also incorporate standings if the current pending user submission is submittted).
- Budget schema values will be rotated manually by the admin every financial year.

## Your recommend approach on implementation and schema definition

- Use the Opus model for exploration and planning and sonnet model for execution.
- Your follow-up questions and recommendations are strongly encouraged.
- Seek clarification for anything that is unclear regarding these proposed changes.
