"use client";

import ModalWrapper from "../Modules/ModalWrapper";
import ITRequisitionPage from "../ITRequisition/ITRequisitionPage";
import TravelRequisitionPage from "../TravelRequisitionPage";
import KeyAccessRequisitionForm from "../Modules/Retail/KeyAccessRequisitionForm";
import CasualRequisitionForm from "../Modules/Retail/CasualRequisitionForm";
import EmployeeRequisitionForm from "../Modules/Retail/EmployeeRequisitionForm";
import { useToggleStore } from "@/store/useToggleStore";

// Requisition form modals, rendered once for the whole dashboard. The desktop
// sidebar and the mobile header only flip the useToggleStore flags; keeping the
// modals here (instead of in both navs) stops every form mounting twice.
const DashboardModals = () => {
  const showITRequisition = useToggleStore((state) => state.showITRequisition);
  const setShowITRequisition = useToggleStore(
    (state) => state.setShowITRequisition,
  );

  const showTravelRequisition = useToggleStore(
    (state) => state.showTravelRequisition,
  );
  const travelAmendmentRequestId = useToggleStore(
    (state) => state.travelAmendmentRequestId,
  );
  const setTravelAmendmentRequestId = useToggleStore(
    (state) => state.setTravelAmendmentRequestId,
  );
  const setShowTravelRequisition = useToggleStore(
    (state) => state.setShowTravelRequisition,
  );

  const showAccessRequisition = useToggleStore(
    (state) => state.showAccessRequisition,
  );
  const setShowAccessRequisition = useToggleStore(
    (state) => state.setShowAccessRequisition,
  );

  const showCasualRequisition = useToggleStore(
    (state) => state.showCasualRequisition,
  );
  const casualAmendmentRequestId = useToggleStore(
    (state) => state.casualAmendmentRequestId,
  );
  const setCasualAmendmentRequestId = useToggleStore(
    (state) => state.setCasualAmendmentRequestId,
  );
  const setShowCasualRequisition = useToggleStore(
    (state) => state.setShowCasualRequisition,
  );

  const showEmployeeRequisition = useToggleStore(
    (state) => state.showEmployeeRequisition,
  );
  const employeeAmendmentRequestId = useToggleStore(
    (state) => state.employeeAmendmentRequestId,
  );
  const setEmployeeAmendmentRequestId = useToggleStore(
    (state) => state.setEmployeeAmendmentRequestId,
  );
  const setShowEmployeeRequisition = useToggleStore(
    (state) => state.setShowEmployeeRequisition,
  );

  return (
    <>
      {/* IT Modal */}
      <ModalWrapper
        isOpen={showITRequisition}
        onClose={() => setShowITRequisition(false)}
      >
        <ITRequisitionPage />
      </ModalWrapper>

      {/* Travel Modal */}
      <ModalWrapper
        isOpen={showTravelRequisition || !!travelAmendmentRequestId}
        onClose={() => {
          setShowTravelRequisition(false);
          setTravelAmendmentRequestId(null);
        }}
      >
        <TravelRequisitionPage amendRequestId={travelAmendmentRequestId} />
      </ModalWrapper>

      {/* Key Access Requisition Modal */}
      <ModalWrapper
        isOpen={showAccessRequisition}
        onClose={() => setShowAccessRequisition(false)}
      >
        <KeyAccessRequisitionForm />
      </ModalWrapper>

      {/* Casual Requisition Modal */}
      <ModalWrapper
        isOpen={showCasualRequisition || !!casualAmendmentRequestId}
        onClose={() => {
          setShowCasualRequisition(false);
          setCasualAmendmentRequestId(null);
        }}
      >
        <CasualRequisitionForm amendRequestId={casualAmendmentRequestId} />
      </ModalWrapper>

      {/* Employee Requisition Modal */}
      <ModalWrapper
        isOpen={showEmployeeRequisition || !!employeeAmendmentRequestId}
        onClose={() => {
          setShowEmployeeRequisition(false);
          setEmployeeAmendmentRequestId(null);
        }}
      >
        <EmployeeRequisitionForm amendRequestId={employeeAmendmentRequestId} />
      </ModalWrapper>
    </>
  );
};

export default DashboardModals;
