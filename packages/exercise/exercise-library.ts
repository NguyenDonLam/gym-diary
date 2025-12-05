import { Exercise } from "./type";

export const DEFAULT_EXERCISES: { id: string; name: string }[] = [
  // DUMBBELL – CHEST
  { id: "9b4a0bbd-9e8e-4c3f-9c5e-4a4f7a1b0001", name: "Dumbbell Bench Press" },
  {
    id: "5f2a1b3e-7d6a-4f21-9f3c-8c2e9d1a0002",
    name: "Dumbbell Incline Bench Press",
  },
  {
    id: "a1c9e7d4-23b8-4d0e-8f2d-7b6c5a9f0003",
    name: "Dumbbell Decline Bench Press",
  },
  { id: "c7d2e4f9-5b1a-4a3f-8c9e-1f2a3b4c0004", name: "Dumbbell Fly" },

  // DUMBBELL – BACK
  {
    id: "e2a9b5c7-1d3f-4c2b-9e8a-7b5c3d1f0005",
    name: "Dumbbell Bent-Over Row",
  },
  {
    id: "f3b1c7d9-2e4a-4f3c-8b9d-6a5c2e1f0006",
    name: "Dumbbell Single-Arm Row",
  },

  // DUMBBELL – SHOULDERS
  {
    id: "1a2b3c4d-5e6f-4789-9a0b-1c2d3e4f0007",
    name: "Dumbbell Shoulder Press",
  },
  {
    id: "2b3c4d5e-6f70-4819-8a1b-2c3d4e5f0008",
    name: "Dumbbell Lateral Raise",
  },
  { id: "3c4d5e6f-7081-4929-8b2c-3d4e5f6a0009", name: "Dumbbell Front Raise" },
  {
    id: "4d5e6f70-8192-4a39-8c3d-4e5f6a7b000a",
    name: "Dumbbell Rear Delt Raise",
  },

  // DUMBBELL – BICEPS
  { id: "5e6f7081-92a3-4b49-8d4e-5f6a7b8c000b", name: "Dumbbell Biceps Curl" },
  { id: "6f708192-a3b4-4c59-8e5f-6a7b8c9d000c", name: "Dumbbell Hammer Curl" },
  { id: "708192a3-b4c5-4d69-8f6a-7b8c9d0e000d", name: "Dumbbell Incline Curl" },

  // DUMBBELL – TRICEPS
  {
    id: "8192a3b4-c5d6-4e79-8a7b-8c9d0e1f000e",
    name: "Dumbbell Skull Crusher",
  },
  {
    id: "92a3b4c5-d6e7-4f89-8b8c-9d0e1f2a000f",
    name: "Dumbbell Overhead Triceps Extension",
  },

  // DUMBBELL – LEGS
  { id: "a3b4c5d6-e7f8-4099-8c9d-0e1f2a3b0010", name: "Dumbbell Goblet Squat" },
  { id: "b4c5d6e7-f809-41a9-8d0e-1f2a3b4c0011", name: "Dumbbell Lunge" },
  {
    id: "c5d6e7f8-091a-42b9-8e1f-2a3b4c5d0012",
    name: "Dumbbell Bulgarian Split Squat",
  },
  {
    id: "d6e7f809-1a2b-43c9-8f2a-3b4c5d6e0013",
    name: "Dumbbell Romanian Deadlift",
  },
  { id: "e7f8091a-2b3c-44d9-8a3b-4c5d6e7f0014", name: "Dumbbell Step-Up" },
  { id: "f8091a2b-3c4d-45e9-8b4c-5d6e7f800015", name: "Dumbbell Calf Raise" },

  // DUMBBELL – CORE / CARRY
  {
    id: "091a2b3c-4d5e-46f9-8c5d-6e7f80910016",
    name: "Dumbbell Russian Twist",
  },
  {
    id: "1a2b3c4d-5e6f-4709-8d6e-7f8091a20017",
    name: "Dumbbell Farmer's Carry",
  },

  // BARBELL – SQUAT / HINGE
  { id: "aa111111-2222-4333-8444-555566667001", name: "Barbell Back Squat" },
  { id: "bb111111-2222-4333-8444-555566667002", name: "Barbell Front Squat" },
  { id: "cc111111-2222-4333-8444-555566667003", name: "Barbell Deadlift" },
  {
    id: "dd111111-2222-4333-8444-555566667004",
    name: "Barbell Romanian Deadlift",
  },
  { id: "ee111111-2222-4333-8444-555566667005", name: "Barbell Hip Thrust" },

  // BARBELL – PRESS
  { id: "ff111111-2222-4333-8444-555566667006", name: "Barbell Bench Press" },
  {
    id: "00111111-2222-4333-8444-555566667007",
    name: "Barbell Incline Bench Press",
  },
  {
    id: "01111111-2222-4333-8444-555566667008",
    name: "Barbell Overhead Press",
  },
  {
    id: "02111111-2222-4333-8444-555566667009",
    name: "Barbell Close-Grip Bench Press",
  },

  // BARBELL – ROW / PULL
  { id: "03111111-2222-4333-8444-55556666700a", name: "Barbell Bent-Over Row" },
  { id: "04111111-2222-4333-8444-55556666700b", name: "Barbell Pendlay Row" },

  // BARBELL – OLY / POWER VARIATIONS (BASIC)
  { id: "05111111-2222-4333-8444-55556666700c", name: "Barbell Power Clean" },
  { id: "06111111-2222-4333-8444-55556666700d", name: "Barbell Push Press" },

  // BARBELL – ACCESSORY
  { id: "07111111-2222-4333-8444-55556666700e", name: "Barbell Biceps Curl" },
  { id: "08111111-2222-4333-8444-55556666700f", name: "Barbell Skull Crusher" },
  // DUMBBELL – CHEST/BACK
  { id: "70965e30-0304-47f4-9277-7f84249ed9a9", name: "Dumbbell Pullover" },
  // DUMBBELL – SHOULDERS
  { id: "e54020d2-c124-4c6f-989e-11ce99dfddc0", name: "Dumbbell Arnold Press" },
  { id: "ebb26740-ebe3-48f1-9a5e-32f7dc7900e5", name: "Dumbbell Upright Row" },
  { id: "7bd299ba-ef0b-47c1-8c9b-ca0366da9084", name: "Dumbbell Shrug" },
  // DUMBBELL – BICEPS
  {
    id: "d9140b40-4639-42d6-af91-d0e4c39eafca",
    name: "Dumbbell Concentration Curl",
  },
  {
    id: "10f353d7-f320-47a7-b5ed-82d5e170cc25",
    name: "Dumbbell Preacher Curl",
  },
  { id: "c5477a7d-c370-40b5-8506-b97946e51734", name: "Dumbbell Zottman Curl" },
  // DUMBBELL – TRICEPS
  {
    id: "4937af56-91b6-4677-8bf2-be7d875fe9c2",
    name: "Dumbbell Triceps Kickback",
  },
  // DUMBBELL – FOREARMS
  { id: "a97fa79e-497b-4474-b7e8-0f558674f4d6", name: "Dumbbell Wrist Curl" },
  {
    id: "ac8be735-cd9f-45f7-9b9a-0cff42cd95d1",
    name: "Dumbbell Reverse Wrist Curl",
  },
  // DUMBBELL – LEGS
  { id: "915f7293-2355-472a-95d2-2eb9a52ed45a", name: "Dumbbell Sumo Squat" },
  { id: "4f8d73f2-6475-42b0-a481-0b77987137be", name: "Dumbbell Side Lunge" },
  {
    id: "5667f0ed-f0d4-4181-8f7c-bb9c583f8fe2",
    name: "Dumbbell Single-Leg Deadlift",
  },
  { id: "8d285be4-e987-4d71-b098-71075d0b9d2e", name: "Dumbbell Thruster" },
  { id: "08b72d08-df0d-4ad4-9439-38f8c8c414fd", name: "Dumbbell Glute Bridge" },
  // DUMBBELL – CORE/CARRY
  { id: "06bf1c9d-54bc-4b1e-90da-de3b8b018fe2", name: "Dumbbell Side Bend" },
  { id: "35187678-96af-4219-a6d9-9067fa3d596e", name: "Dumbbell Woodchop" },
  { id: "0e57ac8d-5536-48df-92bb-0bdf2f47e853", name: "Dumbbell Renegade Row" },
  { id: "1f69d3b2-d8bb-440e-9a38-6559b78b6b13", name: "Dumbbell Snatch" },
  {
    id: "c55bfa53-a196-4721-b2f9-4a1ca1fda222",
    name: "Dumbbell Clean & Press",
  },
  // BARBELL – PRESS
  {
    id: "a1df0041-d6de-49b7-b6a2-610a80a1efb4",
    name: "Barbell Decline Bench Press",
  },
  { id: "f8bd7cb3-a719-4c98-9deb-3adc3a5b17da", name: "Barbell Floor Press" },
  // BARBELL – OLY
  { id: "2a4c80c2-89ed-41e1-b7bc-96ef5169bc9a", name: "Barbell Snatch" },
  {
    id: "e8a5d7f5-a980-42b8-bf88-ecf2eacdd7b6",
    name: "Barbell Clean and Jerk",
  },
  { id: "f9fec4d2-46fb-4f36-8a35-0ccfeb2b29a3", name: "Barbell Hang Clean" },
  { id: "c15b7c4f-0f36-4da8-882d-275b433d8fc8", name: "Barbell Hang Snatch" },
  { id: "73dd9d2a-0861-47f3-913d-38317872a999", name: "Barbell High Pull" },
  // BARBELL – SQUAT/HINGE
  { id: "2d07bcf2-f36b-4f15-8a0e-8b2576e5c6d5", name: "Barbell Sumo Deadlift" },
  { id: "1852f2c3-4d55-45d8-b8f8-596a018d7c55", name: "Barbell Zercher Squat" },
  {
    id: "61218f91-d79f-4c0e-adde-f9da0c434215",
    name: "Barbell Overhead Squat",
  },
  { id: "6f680f2e-5ac1-4fb7-b1fa-0b8531e5e8f4", name: "Barbell Good Morning" },
  // BARBELL – LUNGE
  { id: "b7f50e5c-584e-4b17-af14-75286068de8e", name: "Barbell Lunge" },
  { id: "de691ddb-6722-445d-aa6a-6f5ef16074cc", name: "Barbell Split Squat" },
  { id: "a5f7a5e6-0417-40a9-9a3d-1d7bbea5e3ff", name: "Barbell Thruster" },
  // BARBELL – PULL
  { id: "b75c2cbb-3010-4460-96de-9e97b9ee827e", name: "Barbell Rack Pull" },
  { id: "ea2c98ec-6a18-4eae-8be8-7a7cde469488", name: "Barbell Shrug" },
  { id: "d2f43312-45c8-4f58-9b50-23a97b9820f6", name: "Barbell Upright Row" },
  { id: "930a3068-7d2e-4862-b8e7-0aaf3e6e5a2d", name: "T-Bar Row" },
  // KETTLEBELL – SWING/OLY
  { id: "40fa9f27-27eb-47a3-8c32-862bd68e6477", name: "Kettlebell Deadlift" },
  { id: "6cb57af5-b5b0-454d-9078-367cb0e6b6f5", name: "Kettlebell Swing" },
  { id: "05600c4f-6759-4a9d-8ea4-ecbb7852d2de", name: "Kettlebell Snatch" },
  { id: "a2e0260d-27e5-41f7-ac89-0fe301469995", name: "Kettlebell Clean" },
  {
    id: "94cd8c83-d7d5-4ee1-bfb8-3ef9ecd23f6b",
    name: "Kettlebell Clean and Press",
  },
  { id: "e0c26584-2ee1-4a5b-80c2-48df8b38694c", name: "Kettlebell High Pull" },
  // KETTLEBELL – PRESS/SQUAT
  {
    id: "b5c56470-e657-47b2-82b7-cf2e07d86c54",
    name: "Kettlebell Goblet Squat",
  },
  {
    id: "3ede1d0d-f24e-4fac-a545-30bf3aed1a7d",
    name: "Kettlebell Overhead Press",
  },
  { id: "25ba5248-66b1-45f1-ae46-f72bc58c55a9", name: "Kettlebell Thruster" },
  // KETTLEBELL – CORE/CARRY
  {
    id: "4c210ff8-bbe5-41f2-ab9d-be99fae32546",
    name: "Kettlebell Turkish Get-Up",
  },
  { id: "0b7e2ae9-bd83-49ea-bc26-00cd0c7faeac", name: "Kettlebell Windmill" },
  {
    id: "d0d8efb5-5d3b-4ff8-83f9-3ebcfe843ae0",
    name: "Kettlebell Farmer's Carry",
  },
  // CABLE – CHEST
  { id: "5debf7ed-e889-4d94-b1a0-e3284c9c009c", name: "Cable Chest Fly" },
  // CABLE – BACK
  { id: "eaad35b3-5424-4e48-aa65-79d0590e8f42", name: "Cable Lat Pulldown" },
  { id: "d308d2e9-efbc-4e2c-8d75-458efe974ca1", name: "Cable Seated Row" },
  { id: "d820b05f-4405-4a58-b742-cc43c9998ac8", name: "Cable Face Pull" },
  // CABLE – SHOULDERS
  { id: "4277a391-1f4f-4a11-b058-e82f1e752eb8", name: "Cable Lateral Raise" },
  { id: "77625879-c9ef-48c0-a9f6-dd0e1a3d2a00", name: "Cable Upright Row" },
  // CABLE – ARMS
  {
    id: "d8971ac1-b24e-428c-ad9e-d16e60c16ef2",
    name: "Cable Triceps Pushdown",
  },
  {
    id: "65e62a21-4ecb-4934-b879-f6e5f01088d6",
    name: "Cable Overhead Triceps Extension",
  },
  { id: "078cb44e-f053-4297-9c35-425639353447", name: "Cable Biceps Curl" },
  { id: "1e9b46dc-83b4-4ca8-bbca-225c8c34a5b0", name: "Cable Hammer Curl" },
  // CABLE – CORE/GLUTES
  { id: "f1479a42-b99f-4346-866e-38dc0fca27ef", name: "Cable Woodchop" },
  { id: "33839dfe-6b4e-4f69-8477-1f89c9b55d4d", name: "Cable Crunch" },
  { id: "ae52d615-09ef-4c1d-8a84-8cdb13a114e0", name: "Cable Glute Kickback" },
  { id: "3483a3be-0de0-47e2-8c72-29851bfd8ebd", name: "Cable Pull-Through" },
  // MACHINE – LEGS
  { id: "7ccc0a37-be27-4925-bc5b-79324946085b", name: "Machine Leg Press" },
  { id: "64840ca5-04ed-4c50-b0d8-9fe4fa8f830f", name: "Machine Hack Squat" },
  { id: "9f4efaf3-6768-4565-a6e2-36f2fd085ee1", name: "Machine Leg Extension" },
  {
    id: "d744c73d-fecf-4ded-8245-98f8fe6f535d",
    name: "Machine Seated Leg Curl",
  },
  {
    id: "25d3c9d8-2439-49ed-adb3-a6ffa4f3b707",
    name: "Machine Lying Leg Curl",
  },
  // MACHINE – CALVES
  {
    id: "111b9f3d-14c1-4d2c-811b-86b4b9b1426c",
    name: "Machine Standing Calf Raise",
  },
  {
    id: "6150e9a4-fd6c-4e11-b778-6569e1d7b846",
    name: "Machine Seated Calf Raise",
  },
  // MACHINE – CHEST
  { id: "7a0cc583-fc83-4d8f-94c6-8686393f84e9", name: "Machine Chest Press" },
  { id: "739f5ac2-aef1-45a5-a7a4-204efc0f08ac", name: "Machine Pec Deck Fly" },
  // MACHINE – SHOULDERS
  {
    id: "03b23c1c-9930-4e26-bd2c-f24e7d4d8965",
    name: "Machine Shoulder Press",
  },
  { id: "605a54ee-6232-4dc3-9c59-7da24763acbf", name: "Machine Lateral Raise" },
  // MACHINE – ARMS
  { id: "35611b23-4f42-4fd1-bb36-1aefe2d50ce9", name: "Machine Preacher Curl" },
  // MACHINE – BACK
  {
    id: "9d3c537b-136b-4ffb-9904-d59407028958",
    name: "Machine Back Extension",
  },
  // MACHINE – HIPS/GLUTES
  { id: "d2723ce1-9077-4f1a-8353-0a5a4ca8b917", name: "Machine Hip Adduction" },
  { id: "5dbb2b2d-5d60-4fb5-a65d-b67f65b9b035", name: "Machine Hip Abduction" },
  {
    id: "34f2505d-43d4-4268-911d-7660a237bb7d",
    name: "Machine Glute Kickback",
  },
  // MACHINE – ASSISTED
  {
    id: "be7cda5b-c2c0-47f1-9941-d4414f41af29",
    name: "Machine Assisted Pull-Up",
  },
  { id: "9d6b53cd-e520-41e4-92c2-d8ea7cf4b017", name: "Machine Assisted Dip" },
  // SMITH MACHINE – UPPER
  {
    id: "3bf6f166-8f0d-4a68-92e7-11025f43baf9",
    name: "Smith Machine Bench Press",
  },
  {
    id: "7ef0183c-83f1-45ac-aec8-e731703fa053",
    name: "Smith Machine Incline Bench Press",
  },
  {
    id: "f600f9ae-9e9c-43b4-af78-2de53a0fad9b",
    name: "Smith Machine Shoulder Press",
  },
  {
    id: "a5b0d40d-e383-4699-af68-cf5818a5a143",
    name: "Smith Machine Upright Row",
  },
  {
    id: "d2084f45-6b3e-4a8b-8f10-860fb1b660a3",
    name: "Smith Machine Bent-Over Row",
  },
  { id: "554e2d12-4708-45ec-aa81-c02517f6fb0a", name: "Smith Machine Shrug" },
  // SMITH MACHINE – LOWER
  { id: "d72288b0-1c6f-4109-94a4-3c21c4c5afdf", name: "Smith Machine Squat" },
  { id: "a36ba29d-fd3a-42de-9222-d8f7ebefc729", name: "Smith Machine Lunge" },
  {
    id: "6e0ad8fd-9e83-4486-99c2-735248bd5a57",
    name: "Smith Machine Calf Raise",
  },
  {
    id: "60a9a784-2854-4e4a-8903-35ccb3073fa1",
    name: "Smith Machine Hip Thrust",
  },
  // BODYWEIGHT – PULL
  { id: "45f61193-3907-46ba-8254-576e6325b54e", name: "Bodyweight Pull-Up" },
  { id: "b7242d5b-50a0-4c30-a321-c03d30f19d02", name: "Bodyweight Chin-Up" },
  {
    id: "8bc55b3f-7af2-423d-95a8-8b50873ce67c",
    name: "Bodyweight Inverted Row",
  },
  { id: "d0d70bf9-48d1-410c-9a0e-a43a02f0ae55", name: "Bodyweight Muscle-Up" },
  // BODYWEIGHT – PUSH
  { id: "9d823524-e840-40a3-bb95-9805c22702f4", name: "Bodyweight Dip" },
  { id: "0cec5801-558d-47ef-9da1-c4b2a2c4ae60", name: "Bodyweight Push-Up" },
  {
    id: "1a1d36a8-1648-431c-80a5-4ea1d0bec7cb",
    name: "Bodyweight Handstand Push-Up",
  },
  // BODYWEIGHT – LEGS
  { id: "a0e37b78-9ce9-422c-84d4-da9e7a53029a", name: "Bodyweight Squat" },
  { id: "d3d3685b-baf5-4ae5-9542-d716a5ce9b19", name: "Bodyweight Lunge" },
  {
    id: "f4620d0f-66b4-4256-a77e-1e033da0666c",
    name: "Bodyweight Glute Bridge",
  },
  // BODYWEIGHT – CORE
  { id: "64a3a5c7-cdb0-40ee-8dc8-ca575653c441", name: "Bodyweight Sit-Up" },
  { id: "2ee40053-748a-44c2-a1f5-e0f031f7396b", name: "Bodyweight Crunch" },
  {
    id: "b8aa81df-60f0-4400-ac27-088833c049b2",
    name: "Bodyweight Hanging Leg Raise",
  },
  { id: "49ec6fe2-b02f-450a-9b55-3041cb411d20", name: "Bodyweight Plank" },
  {
    id: "4d78cf2b-32ff-4d16-8116-27961cd3c261",
    name: "Bodyweight Back Extension",
  },
  // OTHER – STRONGMAN
  { id: "cb1cf8a4-231d-4115-8adb-4c8c698b7d0a", name: "Sled Push" },
  { id: "548c8cb6-8e03-40e0-859b-68ef43f131d8", name: "Sled Pull" },
  { id: "6ac23e2f-46ed-476e-a3f1-dfc4e84112eb", name: "Yoke Carry" },
  { id: "5d221f42-7bc6-4f62-a2d6-90e6c5510f17", name: "Tire Flip" },
];
