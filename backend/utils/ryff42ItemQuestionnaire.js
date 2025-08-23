// Ryff Scales of Psychological Well-Being - 42-Item Version
// Backend questionnaire structure for dimension filtering

const ryff42Questions = [
  {
    id: 1,
    text: "I am not afraid to voice my opinions, even when they are in opposition to the opinions of most people.",
    dimension: "autonomy",
    reverse: false
  },
  {
    id: 2,
    text: "In general, I feel I am in charge of the situation in which I live.",
    dimension: "environmental_mastery",
    reverse: false
  },
  {
    id: 3,
    text: "I am not interested in activities that will expand my horizons.",
    dimension: "personal_growth",
    reverse: true
  },
  {
    id: 4,
    text: "Most people see me as loving and affectionate.",
    dimension: "positive_relations",
    reverse: false
  },
  {
    id: 5,
    text: "I live life one day at a time and don't really think about the future.",
    dimension: "purpose_in_life",
    reverse: true
  },
  {
    id: 6,
    text: "When I look at the story of my life, I am pleased with how things have turned out.",
    dimension: "self_acceptance",
    reverse: false
  },
  {
    id: 7,
    text: "My decisions are not usually influenced by what everyone else is doing.",
    dimension: "autonomy",
    reverse: false
  },
  {
    id: 8,
    text: "The demands of everyday life often get me down.",
    dimension: "environmental_mastery",
    reverse: true
  },
  {
    id: 9,
    text: "I think it is important to have new experiences that challenge how you think about yourself and the world.",
    dimension: "personal_growth",
    reverse: false
  },
  {
    id: 10,
    text: "Maintaining close relationships has been difficult and frustrating for me.",
    dimension: "positive_relations",
    reverse: true
  },
  {
    id: 11,
    text: "I have a sense of direction and purpose in life.",
    dimension: "purpose_in_life",
    reverse: false
  },
  {
    id: 12,
    text: "In general, I feel confident and positive about myself.",
    dimension: "self_acceptance",
    reverse: false
  },
  {
    id: 13,
    text: "I tend to worry about what other people think of me.",
    dimension: "autonomy",
    reverse: true
  },
  {
    id: 14,
    text: "I do not fit very well with the people and the community around me.",
    dimension: "environmental_mastery",
    reverse: true
  },
  {
    id: 15,
    text: "When I think about it, I haven't really improved much as a person over the years.",
    dimension: "personal_growth",
    reverse: true
  },
  {
    id: 16,
    text: "I often feel lonely because I have few close friends with whom to share my concerns.",
    dimension: "positive_relations",
    reverse: true
  },
  {
    id: 17,
    text: "My daily activities often seem trivial and unimportant to me.",
    dimension: "purpose_in_life",
    reverse: true
  },
  {
    id: 18,
    text: "I feel like many of the people I know have gotten more out of life than I have.",
    dimension: "self_acceptance",
    reverse: true
  },
  {
    id: 19,
    text: "I tend to be influenced by people with strong opinions.",
    dimension: "autonomy",
    reverse: true
  },
  {
    id: 20,
    text: "I am quite good at managing the many responsibilities of my daily life.",
    dimension: "environmental_mastery",
    reverse: false
  },
  {
    id: 21,
    text: "I have a sense that I have developed a lot as a person over time.",
    dimension: "personal_growth",
    reverse: false
  },
  {
    id: 22,
    text: "I enjoy personal and mutual conversations with family members or friends.",
    dimension: "positive_relations",
    reverse: false
  },
  {
    id: 23,
    text: "I don't have a good sense of what it is I'm trying to accomplish in life.",
    dimension: "purpose_in_life",
    reverse: true
  },
  {
    id: 24,
    text: "I like most aspects of my personality.",
    dimension: "self_acceptance",
    reverse: false
  },
  {
    id: 25,
    text: "I have confidence in my opinions, even if they are contrary to the general consensus.",
    dimension: "autonomy",
    reverse: false
  },
  {
    id: 26,
    text: "I often feel overwhelmed by my responsibilities.",
    dimension: "environmental_mastery",
    reverse: true
  },
  {
    id: 27,
    text: "I do not enjoy being in new situations that require me to change my old familiar ways of doing things.",
    dimension: "personal_growth",
    reverse: true
  },
  {
    id: 28,
    text: "People would describe me as a giving person, willing to share my time with others.",
    dimension: "positive_relations",
    reverse: false
  },
  {
    id: 29,
    text: "I enjoy making plans for the future and working to make them a reality.",
    dimension: "purpose_in_life",
    reverse: false
  },
  {
    id: 30,
    text: "In many ways, I feel disappointed about my achievements in life.",
    dimension: "self_acceptance",
    reverse: true
  },
  {
    id: 31,
    text: "It's difficult for me to voice my own opinions on controversial matters.",
    dimension: "autonomy",
    reverse: true
  },
  {
    id: 32,
    text: "I have difficulty arranging my life in a way that is satisfying to me.",
    dimension: "environmental_mastery",
    reverse: true
  },
  {
    id: 33,
    text: "For me, life has been a continuous process of learning, changing, and growth.",
    dimension: "personal_growth",
    reverse: false
  },
  {
    id: 34,
    text: "I have not experienced many warm and trusting relationships with others.",
    dimension: "positive_relations",
    reverse: true
  },
  {
    id: 35,
    text: "Some people wander aimlessly through life, but I am not one of them.",
    dimension: "purpose_in_life",
    reverse: false
  },
  {
    id: 36,
    text: "My attitude about myself is probably not as positive as most people feel about themselves.",
    dimension: "self_acceptance",
    reverse: true
  },
  {
    id: 37,
    text: "I judge myself by what I think is important, not by the values of what others think is important.",
    dimension: "autonomy",
    reverse: false
  },
  {
    id: 38,
    text: "I have been able to build a home and a lifestyle for myself that is much to my liking.",
    dimension: "environmental_mastery",
    reverse: false
  },
  {
    id: 39,
    text: "I gave up trying to make big improvements or changes in my life a long time ago.",
    dimension: "personal_growth",
    reverse: true
  },
  {
    id: 40,
    text: "I know that I can trust my friends, and they know they can trust me.",
    dimension: "positive_relations",
    reverse: false
  },
  {
    id: 41,
    text: "I sometimes feel as if I've done all there is to do in life.",
    dimension: "purpose_in_life",
    reverse: true
  },
  {
    id: 42,
    text: "When I compare myself to friends and acquaintances, it makes me feel good about who I am.",
    dimension: "self_acceptance",
    reverse: false
  }
];

module.exports = ryff42Questions;