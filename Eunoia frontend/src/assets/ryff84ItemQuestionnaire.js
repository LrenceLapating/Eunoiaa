// Ryff Scales of Psychological Well-Being - 84-Item Version
// Instructions and questionnaire items for the complete version

export const ryff84ItemQuestionnaire = {
  instructions: {
    title: "Ryff Scales of Psychological Well-Being - 84 Item Assessment",
    description: "Please read each statement carefully and rate how much you agree or disagree with it using the scale below:",
    scale: {
      1: "Strongly Disagree",
      2: "Disagree", 
      3: "Slightly Disagree",
      4: "Slightly Agree",
      5: "Agree",
      6: "Strongly Agree"
    }
  },
  items: [
    // Autonomy items (14 items)
    {
      id: 1,
      text: "Sometimes I change the way I act or think to be more like those around me.",
      dimension: "autonomy",
      reverse: true
    },
    {
      id: 2,
      text: "I am not afraid to voice my opinions, even when they are in opposition to the opinions of most people.",
      dimension: "autonomy",
      reverse: false
    },
    {
      id: 3,
      text: "My decisions are not usually influenced by what everyone else is doing.",
      dimension: "autonomy",
      reverse: false
    },
    {
      id: 4,
      text: "I tend to worry about what other people think of me.",
      dimension: "autonomy",
      reverse: true
    },
    {
      id: 5,
      text: "Being happy with myself is more important to me than having others approve of me.",
      dimension: "autonomy",
      reverse: false
    },
    {
      id: 6,
      text: "I tend to be influenced by people with strong opinions.",
      dimension: "autonomy",
      reverse: true
    },
    {
      id: 7,
      text: "People rarely talk me into doing things I don't want to do.",
      dimension: "autonomy",
      reverse: false
    },
    {
      id: 8,
      text: "It is more important to me to \"fit in\" with others than to stand alone on my principles.",
      dimension: "autonomy",
      reverse: true
    },
    {
      id: 9,
      text: "I have confidence in my opinions, even if they are contrary to the general consensus.",
      dimension: "autonomy",
      reverse: false
    },
    {
      id: 10,
      text: "I am not the kind of person who gives in to social pressures to think or act in certain ways.",
      dimension: "autonomy",
      reverse: false
    },
    {
      id: 11,
      text: "I am concerned about how other people evaluate the choices I have made in my life.",
      dimension: "autonomy",
      reverse: true
    },
    {
      id: 12,
      text: "I judge myself by what I think is important, not by the values of what others think is important.",
      dimension: "autonomy",
      reverse: false
    },
    {
      id: 13,
      text: "It's difficult for me to voice my own opinions on controversial matters.",
      dimension: "autonomy",
      reverse: true
    },
    {
      id: 14,
      text: "I often change my mind about decisions if my friends or family disagree.",
      dimension: "autonomy",
      reverse: true
    },

    // Environmental Mastery items (14 items)
    {
      id: 15,
      text: "In general, I feel I am in charge of the situation in which I live.",
      dimension: "environmentalMastery",
      reverse: false
    },
    {
      id: 16,
      text: "The demands of everyday life often get me down.",
      dimension: "environmentalMastery",
      reverse: true
    },
    {
      id: 17,
      text: "I do not fit very well with the people and the community around me.",
      dimension: "environmentalMastery",
      reverse: true
    },
    {
      id: 18,
      text: "I am quite good at managing the many responsibilities of my daily life.",
      dimension: "environmentalMastery",
      reverse: false
    },
    {
      id: 19,
      text: "I often feel overwhelmed by my responsibilities.",
      dimension: "environmentalMastery",
      reverse: true
    },
    {
      id: 20,
      text: "If I were unhappy with my living situation, I would take effective steps to change it.",
      dimension: "environmentalMastery",
      reverse: false
    },
    {
      id: 21,
      text: "I generally do a good job of taking care of my personal finances and affairs.",
      dimension: "environmentalMastery",
      reverse: false
    },
    {
      id: 22,
      text: "I find it stressful that I can't keep up with all of the things I have to do each day.",
      dimension: "environmentalMastery",
      reverse: true
    },
    {
      id: 23,
      text: "I am good at juggling my time so that I can fit everything in that needs to be done.",
      dimension: "environmentalMastery",
      reverse: false
    },
    {
      id: 24,
      text: "My daily life is busy, but I derive a sense of satisfaction from keeping up with everything.",
      dimension: "environmentalMastery",
      reverse: false
    },
    {
      id: 25,
      text: "I get frustrated when trying to plan my daily activities because I never accomplish the things I set out to do.",
      dimension: "environmentalMastery",
      reverse: true
    },
    {
      id: 26,
      text: "My efforts to find the kinds of activities and relationships that I need have been quite successful.",
      dimension: "environmentalMastery",
      reverse: false
    },
    {
      id: 27,
      text: "I have difficulty arranging my life in a way that is satisfying to me.",
      dimension: "environmentalMastery",
      reverse: true
    },
    {
      id: 28,
      text: "I have been able to build a home and a lifestyle for myself that is much to my liking.",
      dimension: "environmentalMastery",
      reverse: false
    },

    // Personal Growth items (14 items)
    {
      id: 29,
      text: "I am not interested in activities that will expand my horizons.",
      dimension: "personalGrowth",
      reverse: true
    },
    {
      id: 30,
      text: "In general, I feel that I continue to learn more about myself as time goes by.",
      dimension: "personalGrowth",
      reverse: false
    },
    {
      id: 31,
      text: "I am the kind of person who likes to give new things a try.",
      dimension: "personalGrowth",
      reverse: false
    },
    {
      id: 32,
      text: "I don't want to try new ways of doing things—my life is fine the way it is.",
      dimension: "personalGrowth",
      reverse: true
    },
    {
      id: 33,
      text: "I think it is important to have new experiences that challenge how you think about yourself and the world.",
      dimension: "personalGrowth",
      reverse: false
    },
    {
      id: 34,
      text: "When I think about it, I haven't really improved much as a person over the years.",
      dimension: "personalGrowth",
      reverse: true
    },
    {
      id: 35,
      text: "In my view, people of every age are able to continue growing and developing.",
      dimension: "personalGrowth",
      reverse: false
    },
    {
      id: 36,
      text: "With time, I have gained a lot of insight about life that has made me a stronger, more capable person.",
      dimension: "personalGrowth",
      reverse: false
    },
    {
      id: 37,
      text: "I have the sense that I have developed a lot as a person over time.",
      dimension: "personalGrowth",
      reverse: false
    },
    {
      id: 38,
      text: "I do not enjoy being in new situations that require me to change my old familiar ways of doing things.",
      dimension: "personalGrowth",
      reverse: true
    },
    {
      id: 39,
      text: "For me, life has been a continuous process of learning, changing, and growth.",
      dimension: "personalGrowth",
      reverse: false
    },
    {
      id: 40,
      text: "I enjoy seeing how my views have changed and matured over the years.",
      dimension: "personalGrowth",
      reverse: false
    },
    {
      id: 41,
      text: "I gave up trying to make big improvements or changes in my life a long time ago.",
      dimension: "personalGrowth",
      reverse: true
    },
    {
      id: 42,
      text: "There is truth to the saying you can't teach an old dog new tricks.",
      dimension: "personalGrowth",
      reverse: true
    },

    // Positive Relations with Others items (14 items)
    {
      id: 43,
      text: "Most people see me as loving and affectionate.",
      dimension: "positiveRelations",
      reverse: false
    },
    {
      id: 44,
      text: "Maintaining close relationships has been difficult and frustrating for me.",
      dimension: "positiveRelations",
      reverse: true
    },
    {
      id: 45,
      text: "I often feel lonely because I have few close friends with whom to share my concerns.",
      dimension: "positiveRelations",
      reverse: true
    },
    {
      id: 46,
      text: "I enjoy personal and mutual conversations with family members or friends.",
      dimension: "positiveRelations",
      reverse: false
    },
    {
      id: 47,
      text: "It is important to me to be a good listener when close friends talk to me about their problems.",
      dimension: "positiveRelations",
      reverse: false
    },
    {
      id: 48,
      text: "I don't have many people who want to listen when I need to talk.",
      dimension: "positiveRelations",
      reverse: true
    },
    {
      id: 49,
      text: "I feel like I get a lot out of my friendships.",
      dimension: "positiveRelations",
      reverse: false
    },
    {
      id: 50,
      text: "It seems to me that most other people have more friends than I do.",
      dimension: "positiveRelations",
      reverse: true
    },
    {
      id: 51,
      text: "People would describe me as a giving person, willing to share my time with others.",
      dimension: "positiveRelations",
      reverse: false
    },
    {
      id: 52,
      text: "I have not experienced many warm and trusting relationships with others.",
      dimension: "positiveRelations",
      reverse: true
    },
    {
      id: 53,
      text: "I know that I can trust my friends, and they know they can trust me.",
      dimension: "positiveRelations",
      reverse: false
    },
    {
      id: 54,
      text: "I often feel like I'm on the outside looking in when it comes to friendships.",
      dimension: "positiveRelations",
      reverse: true
    },
    {
      id: 55,
      text: "I find it difficult to really open up when I talk with others.",
      dimension: "positiveRelations",
      reverse: true
    },
    {
      id: 56,
      text: "My friends and I sympathize with each other's problems.",
      dimension: "positiveRelations",
      reverse: false
    },

    // Purpose in Life items (14 items)
    {
      id: 57,
      text: "I feel good when I think of what I've done in the past and what I hope to do in the future.",
      dimension: "purposeInLife",
      reverse: false
    },
    {
      id: 58,
      text: "I live life one day at a time and don't really think about the future.",
      dimension: "purposeInLife",
      reverse: true
    },
    {
      id: 59,
      text: "I tend to focus on the present, because the future nearly always brings me problems.",
      dimension: "purposeInLife",
      reverse: true
    },
    {
      id: 60,
      text: "I have a sense of direction and purpose in life.",
      dimension: "purposeInLife",
      reverse: false
    },
    {
      id: 61,
      text: "My daily activities often seem trivial and unimportant to me.",
      dimension: "purposeInLife",
      reverse: true
    },
    {
      id: 62,
      text: "I don't have a good sense of what it is I'm trying to accomplish in life.",
      dimension: "purposeInLife",
      reverse: true
    },
    {
      id: 63,
      text: "I used to set goals for myself, but that now seems like a waste of time.",
      dimension: "purposeInLife",
      reverse: true
    },
    {
      id: 64,
      text: "I enjoy making plans for the future and working to make them a reality.",
      dimension: "purposeInLife",
      reverse: false
    },
    {
      id: 65,
      text: "I am an active person in carrying out the plans I set for myself.",
      dimension: "purposeInLife",
      reverse: false
    },
    {
      id: 66,
      text: "Some people wander aimlessly through life, but I am not one of them.",
      dimension: "purposeInLife",
      reverse: false
    },
    {
      id: 67,
      text: "I sometimes feel as if I've done all there is to do in life.",
      dimension: "purposeInLife",
      reverse: true
    },
    {
      id: 68,
      text: "My aims in life have been more a source of satisfaction than frustration to me.",
      dimension: "purposeInLife",
      reverse: false
    },
    {
      id: 69,
      text: "I find it satisfying to think about what I have accomplished in life.",
      dimension: "purposeInLife",
      reverse: false
    },
    {
      id: 70,
      text: "In the final analysis, I'm not so sure that my life adds up to much.",
      dimension: "purposeInLife",
      reverse: true
    },

    // Self-Acceptance items (14 items)
    {
      id: 71,
      text: "When I look at the story of my life, I am pleased with how things have turned out.",
      dimension: "selfAcceptance",
      reverse: false
    },
    {
      id: 72,
      text: "I feel like many of the people I know have gotten more out of life than I have.",
      dimension: "selfAcceptance",
      reverse: true
    },
    {
      id: 73,
      text: "In general, I feel confident and positive about myself.",
      dimension: "selfAcceptance",
      reverse: false
    },
    {
      id: 74,
      text: "Given the opportunity, there are many things about myself that I would change.",
      dimension: "selfAcceptance",
      reverse: true
    },
    {
      id: 75,
      text: "I like most aspects of my personality.",
      dimension: "selfAcceptance",
      reverse: false
    },
    {
      id: 76,
      text: "I made some mistakes in the past, but I feel that all in all everything has worked out for the best.",
      dimension: "selfAcceptance",
      reverse: false
    },
    {
      id: 77,
      text: "In many ways, I feel disappointed about my achievements in life.",
      dimension: "selfAcceptance",
      reverse: true
    },
    {
      id: 78,
      text: "For the most part, I am proud of who I am and the life I lead.",
      dimension: "selfAcceptance",
      reverse: false
    },
    {
      id: 79,
      text: "I envy many people for the lives they lead.",
      dimension: "selfAcceptance",
      reverse: true
    },
    {
      id: 80,
      text: "My attitude about myself is probably not as positive as most people feel about themselves.",
      dimension: "selfAcceptance",
      reverse: true
    },
    {
      id: 81,
      text: "Many days I wake up feeling discouraged about how I have lived my life.",
      dimension: "selfAcceptance",
      reverse: true
    },
    {
      id: 82,
      text: "The past had its ups and downs, but in general, I wouldn't want to change it.",
      dimension: "selfAcceptance",
      reverse: false
    },
    {
      id: 83,
      text: "When I compare myself to friends and acquaintances, it makes me feel good about who I am.",
      dimension: "selfAcceptance",
      reverse: false
    },
    {
      id: 84,
      text: "Everyone has their weaknesses, but I seem to have more than my share.",
      dimension: "selfAcceptance",
      reverse: true
    }
  ],
  
  // Dimension information
  dimensions: {
    autonomy: {
      name: "Autonomy",
      description: "Self-determination and independence; ability to resist social pressures",
      itemCount: 14
    },
    environmentalMastery: {
      name: "Environmental Mastery", 
      description: "Competence in managing environment; control over complex array of external activities",
      itemCount: 14
    },
    personalGrowth: {
      name: "Personal Growth",
      description: "Continued development; seeing self as growing and expanding",
      itemCount: 14
    },
    positiveRelations: {
      name: "Positive Relations with Others",
      description: "Warm, satisfying, trusting relationships; concern for others' welfare",
      itemCount: 14
    },
    purposeInLife: {
      name: "Purpose in Life",
      description: "Goals in life and sense of directedness; meaning in present and past life",
      itemCount: 14
    },
    selfAcceptance: {
      name: "Self-Acceptance",
      description: "Positive attitude toward self; acknowledges and accepts multiple aspects of self",
      itemCount: 14
    }
  },
  
  // Scoring information
  scoring: {
    itemsPerDimension: 14,
    totalItems: 84,
    scaleRange: {
      min: 1,
      max: 6
    },
    subscaleRange: {
      min: 14, // 14 items × 1 point minimum
      max: 84  // 14 items × 6 points maximum
    }
  }
};

export default ryff84ItemQuestionnaire;