# Proposed changes to the casual requisition process

This file outlines the proposed changes to the casual requisition workflow

## New casual requisition amendment workflow

- There's a need for a new casual requisition amendment workflow where the amended changes are linked to the originally submitted requisition.
- This means we will remove the hr approved casuals logic (both in backend and all related UI), coz such changes will have to originate from the submitter.
- The amendment requisition changes will live in a new table linked to both the main requisitions table and the casual sections table (you'll advise on the best way to achieve this).
- Amendment window is before HR approves (the final approver). Submitter cannot raise an amendment for a fully approved requisition. This can be included as a tooltip note card when a submitter is raising an amendment.
- Submitting an amendment nullifies any recorded approval workflow logic in the database, since the approval workflow will have to start again (related recorded approval workflow data in the table will have to be reset to their defaults).
- Button for initiating an amendment will be included in the casual requisition details modal triggered from the dashboard (button only visible to the original submitter who is authorized to raise an amendment change).
- Explore all files related to the casual requisition workflow so as to see how to implement the amendment workflow changes.

## Amendment UI in approval modals, pdfs, details pages, dashboard table modlas, and related email templates

- Requisitions which have amendment histories will show the amendment related UI

## Proposed Ideas

- You can explore on how we can reuse the existing casual requisition modal form for this to avoid duplication of ui logic.
- Recommend on the best approach to achieve these proposed changes.

## Documentation Updates

- Related README.md and CLAUDE.md sections will need to be updated after the new proposed changes are implemented

## Implementation and execution

- Use the Opus model for exploration and planning, and the sonnet model for executing the generated plan.
- Seek clarification on unclear areas regarding the proposed changes.
- You can critic on the proposed changes if you think there are better approaches.
- Flag missing areas related to the proposed changes which are not included in this file.
- Your follow-up questions and recommendations are greatly encouraged.
- Skip the CHANGES.md file - it contains proposed changes which will be implemented after the amendment workflow.
