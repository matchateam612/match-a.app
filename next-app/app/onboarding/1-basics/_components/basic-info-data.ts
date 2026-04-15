import type {
  BasicInfoDraft,
  EthnicityOption,
  GenderIdentityOption,
  InterestedInOption,
  PreferredEthnicityOption,
} from "./basic-info-types";

export const USER_INFO_STORAGE_KEY = "user_info";
export const BASIC_INFO_STEP_STORAGE_KEY = "user_info.basic_info.current_step";
export const TOTAL_SECTIONS = 4;
export const TOTAL_STEPS = 5;

export const initialDraft: BasicInfoDraft = {
  age: "",
  genderIdentity: "",
  genderIdentityCustom: "",
  interestedIn: "",
  interestedInCustom: "",
  city: "",
  ethnicity: "",
  preferredEthnicities: [],
};

export const genderIdentityOptions: Array<{
  value: GenderIdentityOption;
  title: string;
  copy: string;
}> = [
  { value: "man", title: "Man", copy: "Use this for profile identity and discovery." },
  { value: "woman", title: "Woman", copy: "Use this for profile identity and discovery." },
  {
    value: "non-binary",
    title: "Non-binary",
    copy: "Visible in identity and matching filters.",
  },
  {
    value: "exploring",
    title: "Still exploring",
    copy: "You can update this later as your profile evolves.",
  },
  {
    value: "custom",
    title: "Custom",
    copy: "Write the identity language that fits you best.",
  },
  {
    value: "prefer-not-to-say",
    title: "Prefer not to say",
    copy: "Keep this private for now.",
  },
];

export const interestedInOptions: Array<{
  value: InterestedInOption;
  title: string;
  copy: string;
}> = [
  { value: "women", title: "Women", copy: "Match primarily with women." },
  { value: "men", title: "Men", copy: "Match primarily with men." },
  {
    value: "non-binary",
    title: "Non-binary people",
    copy: "Prioritize non-binary matches.",
  },
  {
    value: "everyone",
    title: "Everyone",
    copy: "Stay open across the gender spectrum.",
  },
  {
    value: "custom",
    title: "Custom",
    copy: "Describe your preference in your own words.",
  },
];

export const ethnicityOptions: Array<{ value: EthnicityOption; title: string }> = [
  { value: "asian", title: "Asian" },
  { value: "white", title: "White" },
  { value: "hispanic-latino", title: "Hispanic / Latino" },
  { value: "black", title: "Black" },
  { value: "middle-eastern", title: "Middle Eastern" },
  { value: "mixed", title: "Mixed" },
  { value: "other", title: "Other" },
  { value: "prefer-not-to-say", title: "Prefer not to say" },
];

export const preferredEthnicityOptions: Array<{
  value: PreferredEthnicityOption;
  title: string;
  copy: string;
}> = [
  { value: "asian", title: "Asian", copy: "Open to Asian matches." },
  { value: "white", title: "White", copy: "Open to White matches." },
  {
    value: "hispanic-latino",
    title: "Hispanic / Latino",
    copy: "Open to Hispanic or Latino matches.",
  },
  { value: "black", title: "Black", copy: "Open to Black matches." },
  {
    value: "middle-eastern",
    title: "Middle Eastern",
    copy: "Open to Middle Eastern matches.",
  },
  { value: "mixed", title: "Mixed", copy: "Open to mixed-heritage matches." },
  { value: "other", title: "Other", copy: "Open beyond the listed groups." },
  { value: "any-race", title: "Any race", copy: "No ethnicity preference." },
];
