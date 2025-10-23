export const QNA_ABI = [
  // ==================== WRITE FUNCTIONS ====================

  {
    type: 'function',
    name: 'askQuestion',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'bounty', type: 'uint256' },
      { name: 'deadline', type: 'uint40' },
      { name: 'uri', type: 'string' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'answerQuestion',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'questionId', type: 'uint256' },
      { name: 'uri', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'acceptAnswer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'questionId', type: 'uint256' },
      { name: 'answerId', type: 'uint256' },
    ],
    outputs: [],
  },
  //  NEW: Admin function to accept answers (THIS IS THE KEY ADDITION!)
  {
    type: 'function',
    name: 'acceptAnswerAsAdmin',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'questionId', type: 'uint256' },
      { name: 'answerId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'addBounty',
    stateMutability: 'payable',
    inputs: [
      { name: 'questionId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'refundExpired',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'questionId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'cancelQuestion',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'questionId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'fundBounty',
    stateMutability: 'payable',
    inputs: [{ name: 'qId', type: 'uint256' }],
    outputs: [],
  },

  // ==================== VIEW FUNCTIONS ====================

  {
    type: 'function',
    name: 'getQuestion',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      {
        components: [
          { name: 'asker', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'bounty', type: 'uint256' },
          { name: 'createdAt', type: 'uint40' },
          { name: 'deadline', type: 'uint40' },
          { name: 'status', type: 'uint8' },
          { name: 'uri', type: 'string' },
          { name: 'answersCount', type: 'uint256' },
          { name: 'acceptedAnswerId', type: 'uint256' },
          { name: 'refunded', type: 'bool' },
        ],
        type: 'tuple',
      },
    ],
  },
  {
    type: 'function',
    name: 'getAnswer',
    stateMutability: 'view',
    inputs: [
      { name: 'qid', type: 'uint256' },
      { name: 'aid', type: 'uint256' },
    ],
    outputs: [
      {
        components: [
          { name: 'answerer', type: 'address' },
          { name: 'createdAt', type: 'uint40' },
          { name: 'uri', type: 'string' },
        ],
        type: 'tuple',
      },
    ],
  },
  {
    type: 'function',
    name: 'bountyOf',
    stateMutability: 'view',
    inputs: [{ name: 'qId', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'questionCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'questionCounter',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'paused',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },

  // ==================== EVENTS ====================

  {
    type: 'event',
    name: 'QuestionAsked',
    inputs: [
      { name: 'questionId', type: 'uint256', indexed: true },
      { name: 'asker', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'bounty', type: 'uint256', indexed: false },
      { name: 'deadline', type: 'uint40', indexed: false },
      { name: 'uri', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AnswerPosted',
    inputs: [
      { name: 'questionId', type: 'uint256', indexed: true },
      { name: 'answerId', type: 'uint256', indexed: true },
      { name: 'answerer', type: 'address', indexed: true },
      { name: 'uri', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AnswerAccepted',
    inputs: [
      { name: 'questionId', type: 'uint256', indexed: true },
      { name: 'answerId', type: 'uint256', indexed: true },
      { name: 'answerer', type: 'address', indexed: true },
      { name: 'bounty', type: 'uint256', indexed: false },
      { name: 'token', type: 'address', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BountyAdded',
    inputs: [
      { name: 'questionId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'token', type: 'address', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BountyRefunded',
    inputs: [
      { name: 'questionId', type: 'uint256', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'token', type: 'address', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'QuestionCancelled',
    inputs: [
      { name: 'questionId', type: 'uint256', indexed: true },
      { name: 'by', type: 'address', indexed: true },
    ],
  },
] as const;
