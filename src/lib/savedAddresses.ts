export type SavedAddress = {
  id: string;
  label: string;
  full_address: string;
  city: string;
  pincode: string | null;
  is_default: boolean;
  created_at: string;
};
