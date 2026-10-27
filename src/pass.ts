export interface Pass {
  id: string;
  name: string;
  document: string;
  issuedAt: Date;
  status: "ACTIVE" | "CANCELLED";
}
