export type GenderIdentityOption =
  | "man"
  | "woman"
  | "non-binary"
  | "exploring"
  | "custom"
  | "prefer-not-to-say";

export type InterestedInOption =
  | "men"
  | "women"
  | "non-binary"
  | "everyone"
  | "custom";

export type EthnicityOption =
  | "asian"
  | "white"
  | "hispanic-latino"
  | "black"
  | "middle-eastern"
  | "mixed"
  | "other"
  | "prefer-not-to-say";

export type PreferredEthnicityOption =
  | "asian"
  | "white"
  | "hispanic-latino"
  | "black"
  | "middle-eastern"
  | "mixed"
  | "other"
  | "any-race";

export type BasicInfoDraft = {
  age: string;
  preferredAgeMin: string;
  preferredAgeMax: string;
  genderIdentity: GenderIdentityOption | "";
  genderIdentityCustom: string;
  interestedIn: InterestedInOption | "";
  interestedInCustom: string;
  ethnicity: EthnicityOption | "";
  preferredEthnicities: PreferredEthnicityOption[];
};
