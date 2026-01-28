// config.ts

export const EXCLUDED_PAGES = [
  "cover",
  "welcome",
  "overview",
  "changelog",
  "placeholder",
  "template",
];

export const ALLOWED_SIZES_FUNCTIONAL = [64, 48, 32, 24, 20];

export const STATUS_CONFIG = {
  feat: { emoji: "⭐️", label: "feat" },
  fix: { emoji: "🪲", label: "fix" },
  refactor: { emoji: "🔁", label: "refactor" },
  docs: { emoji: "📝", label: "docs" },
  chore: { emoji: "🔧", label: "chore" },
  deprecated: { emoji: "⚠️", label: "deprecated" },
};

export const TAG_COMPONENT_KEY = "c751d4814029f8e43c7be181c5adf9bd7d9ba8d5";

export const VARIABLE_KEYS = {
  changelog: {
    gap: "e78d8e26882571f30187cbf2ba64506c139f5c8a",
    padding: "71b85a42d436c917ac405692ef86ed99597d789a",
    strokeWeight: "66832c3b7274994cd407781d49d031b9fc588f4d",
    fillColor: "539324f386b2150504d789cfbad9126c14cbdad1",
    strokeColor: "47a78b18c953cec8622180b54e0ab9c1ab5b30ca",
    width: "376e09539dd3c7da959848e0ec2abf32fc448e25",
  },
  changelogStatus: {
    gap: "7bf011be28799b8941bfdc8d3e4bdef53a98bfee",
  },
  changelogIconsContainer: {
    gap: "783a93db6d2cc787ac709aadc1062ad083568515",
  },
  changelogHeadline: {
    fontFamily: "71f3cc5a6e0ed02ad036f6e2ed7612a44a3be38b",
    fontStyle: "ddffc1d793e4277ecbbac3534ae1f7f29edb63c2",
    fontSize: "b34837529a41479a0c478026efa5323aff4ff3ea",
    lineHeight: "f7b780f8287fd461c6a7e2c29e0e522fe100ebe9",
    paragraphSpacing: "b6250a42d6752165dea917f5a990a54b54f68f4a",
    textColor: "497497bca9694f6004d1667de59f1a903b3cd3ef",
  },
};
