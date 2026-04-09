"use client";

import { BlockRequestModal } from "./BlockRequestModal";

type Property = {
  id: string;
  name: string;
  address: string;
  bedrooms: number | null;
};

export function BlockRequestWizard({
  properties,
  onClose,
}: {
  properties: Property[];
  ownerName: string;
  ownerEmail: string;
  onClose: () => void;
}) {
  return (
    <BlockRequestModal
      properties={properties.map((p) => ({ id: p.id, name: p.name }))}
      pastRequests={[]}
      onClose={onClose}
    />
  );
}
