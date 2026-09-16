export const input={question:'Is a 20% increase followed by a 20% decrease a wash?',answerA:'Yes. The percentages cancel.',answerB:'No. 100 times 1.2 times 0.8 is 96.',nameA:'',nameB:'',web:false};
export const report={
  verdict:'B',headline:'Different percentage bases',confidence:'high',confidenceReason:'Direct arithmetic supports the result.',rationale:'100 × 1.2 × 0.8 = 96.',
  answerA:{conclusion:'The original amount is unchanged.',reasoning:[{explanation:'Treats the changes as canceling.',basis:'stated',quote:'The percentages cancel.'}],strengths:[],weaknesses:['The percentage bases differ.']},
  answerB:{conclusion:'The result is 96.',reasoning:[{explanation:'Applies both multipliers in sequence.',basis:'stated',quote:'100 times 1.2 times 0.8 is 96.'}],strengths:['Correct arithmetic.'],weaknesses:[]},
  agreements:[],differences:['The base used for the second percentage.'],claims:[{claim:'The result is 96.',answer:'B',assessment:'supported',basis:'calculation',explanation:'120 × 0.8 = 96.',quote:input.answerB,sourceIds:[]}],betterAnswer:'No. You end up 4% below the starting amount.',limitations:['Assumes percentages apply sequentially.'],sources:[],meta:{model:'test-only',createdAt:'2026-09-16T00:00:00.000Z',webRequested:false,searched:false,usage:{inputTokens:0,outputTokens:0}},
};
