function factorial(n: number) { 
  let ans = 1; 
  
  if(n === 0)
      return 1;
  for (let i = 2; i <= n; i++) 
      ans = ans * i; 
  return ans; 
}

export default function hitChance(deckSize: number, blanksInDeck: number, drawSize: number) : number{
  let result = 0;

  // Calculate the probability of drawing exactly one blank
  if(drawSize >= deckSize-blanksInDeck+2)
    return result
  
  result += blanksInDeck*drawSize*factorial(deckSize - blanksInDeck)/factorial(deckSize-blanksInDeck-drawSize+1)*factorial(deckSize-drawSize)/factorial(deckSize);
  
  // Add the probability of drawing zero blanks
  if(drawSize <= deckSize-blanksInDeck+1)
    result += factorial(deckSize-blanksInDeck)/factorial(deckSize-blanksInDeck-drawSize)*factorial(deckSize-drawSize)/factorial(deckSize);

  return result;
}

function drawZeroBlank(deckSize: number, blanksInDeck: number, drawSize: number) : number{
  let result = 0;

  if(drawSize > deckSize-blanksInDeck+1)
    return result;

  result += factorial(deckSize-blanksInDeck)/factorial(deckSize-blanksInDeck-drawSize)*factorial(deckSize-drawSize)/factorial(deckSize);

  return result;

}

function drawOneBlank(deckSize: number, blanksInDeck: number, drawSize: number) : number{
  let result = 0;

  if(drawSize >= deckSize-blanksInDeck+2)
    return result;

  result += blanksInDeck*drawSize*factorial(deckSize - blanksInDeck)/factorial(deckSize-blanksInDeck-drawSize+1)*factorial(deckSize-drawSize)/factorial(deckSize);

  return result;

}