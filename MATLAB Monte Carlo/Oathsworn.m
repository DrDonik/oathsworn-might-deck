%% Initialization
clear variables

dmgNumbers = [0 1 2 2   ... % White cards
              0 1 2 3 3 ... % Yellow cards
              0 2 3 4   ... % Red cards
              0 3 4 5];     % Black cards
% Indices 4, 9, 13 and 17 are crits

fullDeck   = [6 6 3 3   ... % White cards
              6 3 3 3 3 ... % Yellow cards
              6 3 6 3   ... % Red cards
              6 6 3 3];     % Black cards

%% User-specified script
drawPile    = [1 1 2 2 ...
               0 0 0 0 0 ...
               0 0 0 0 ...
               0 0 0 0];
%drawPile = fullDeck;

% Number of Monte Carlo runs
nMC = 250000;

%for nW = 1:10
  % Cards to draw:
  NdrawWhite  = 5;
  NdrawYellow = 0;
  NdrawRed    = 0;
  NdrawBlack  = 0;
  
  nRedrawTokens = 0;
  
  resolveCritsImmediately = true;
  
  % PMF stands for probability mass function
  [dmgPMF, blanksPMF, MblanksPMF] = drawCards(nMC,nRedrawTokens,fullDeck,dmgNumbers,drawPile,NdrawWhite,NdrawYellow,NdrawRed,NdrawBlack,resolveCritsImmediately);
  
  maxDmg = find(dmgPMF,1,'last') - 1;
  EVdmg_ = sum((0:maxDmg).'.*dmgPMF(1:maxDmg+1))
  HITdmg_ = sum((0:maxDmg).'.*dmgPMF(1:maxDmg+1))/sum(dmgPMF(2:maxDmg+1))
  figure(1);
  subplot(2,1,1);
  %sgtitle(['Drawing ' num2str(nW) ' white cards']);
  bar(0:maxDmg,dmgPMF(1:maxDmg+1));
  ylabel('PMF');
  xlabel('Damage');
  
  % Mblanks: Missing-blanks, blanks that count for the purposes of missing (not blanks drawn on crits)
  maxMblanks = find(MblanksPMF,1,'last') - 1;
  Pmiss_ = 1 - MblanksPMF(1) - MblanksPMF(2)
  subplot(2,1,2);
  bar(0:maxMblanks,MblanksPMF(1:maxMblanks+1))
  ylabel('PMF');
  xlabel('Missing-blanks');
  
%  EVdmg(nW,1) = EVdmg_; %#ok<SAGROW>
%  HITdmg(nW,1) = HITdmg_;
%  Pmiss(nW,1) = round(Pmiss_,15); %#ok<SAGROW>
%  drawnow;
%end

%nWhites = (1:10).';
%table(nWhites,EVdmg,Pmiss,HITdmg)

%% Functions
function [dmgPMF, blanksPMF, MblanksPMF] = drawCards(nMC,nRedrawTokens_,fullDeck,dmgNumbers,drawPile,NdrawWhite,NdrawYellow,NdrawRed,NdrawBlack,resolveCritsImmediately)
  % "state" definition
  % 1-17: Draw pile (white 0 -> black 5 crit)
  % 18-34: On table (white 0 -> black 5 crit)
  % 35: Blanks on table that count for missing
  
  % A "drawPile" is just indices 1-17 of "states"

  whiteIdxs = 1:4;
  yellowIdxs = 5:9;
  redIdxs = 10:13;
  blackIdxs = 14:17;

  dmgPMF = zeros(50,1);
  blanksPMF = dmgPMF;
  MblanksPMF = dmgPMF;
  
  for iMC = 1:nMC
    % Draw cards
    state = [drawPile zeros(size(drawPile)) 0]; % We start in a specific state where we have nothing on the table and no blanks counted for missing
    nRedrawTokens = nRedrawTokens_;

    for iDraw = 1:NdrawBlack
      [state, nRedrawTokens] = drawCard(state,nRedrawTokens,fullDeck,blackIdxs,resolveCritsImmediately,false);
    end
    for iDraw = 1:NdrawRed
      [state, nRedrawTokens] = drawCard(state,nRedrawTokens,fullDeck,redIdxs,resolveCritsImmediately,false);
    end
    for iDraw = 1:NdrawYellow
      [state, nRedrawTokens] = drawCard(state,nRedrawTokens,fullDeck,yellowIdxs,resolveCritsImmediately,false);
    end
    for iDraw = 1:NdrawWhite
      [state, nRedrawTokens] = drawCard(state,nRedrawTokens,fullDeck,whiteIdxs,resolveCritsImmediately,false);
    end
    if ~resolveCritsImmediately
      Mblanks = state(35);
      for iDraw = 1:state(17 + 17)
        [state, nRedrawTokens] = drawCard(state,nRedrawTokens,fullDeck,blackIdxs,true,true);
      end
      for iDraw = 1:state(13 + 17)
        [state, nRedrawTokens] = drawCard(state,nRedrawTokens,fullDeck,redIdxs,true,true);
      end
      for iDraw = 1:state(9 + 17)
        [state, nRedrawTokens] = drawCard(state,nRedrawTokens,fullDeck,yellowIdxs,true,true);
      end
      for iDraw = 1:state(4 + 17)
        [state, nRedrawTokens] = drawCard(state,nRedrawTokens,fullDeck,whiteIdxs,true,true);
      end
      state(35) = Mblanks; % These do not generate blanks for missing
    end
    blanks = sum(state(17 + [1 5 10 14]));
    blanksPMF(blanks + 1) = blanksPMF(blanks + 1) + 1;
    Mblanks = state(35);
    MblanksPMF(Mblanks + 1) = MblanksPMF(Mblanks + 1) + 1;
    dmg = sum(state(18:34).*dmgNumbers)*(Mblanks < 2);
    dmgPMF(dmg + 1) = dmgPMF(dmg + 1) + 1;
  end
  
  blanksPMF = blanksPMF/sum(blanksPMF);
  MblanksPMF = MblanksPMF/sum(MblanksPMF);
  dmgPMF = dmgPMF/sum(dmgPMF);
end

function [state, nRedrawTokens] = drawCard(state, nRedrawTokens, fullDeck, colorIdxs, resolveCritsImmediately, drawnOnCrit)
  if all(state(colorIdxs) == 0) % Shuffle this might deck
    state(colorIdxs) = fullDeck(colorIdxs) - state(colorIdxs + 17); % Whatever is on the table should not be shuffled
  end
  
  iCardDrawn = min(colorIdxs) - 1 + find(randi([1 sum(state(colorIdxs))]) <= cumsum(state(colorIdxs)),1,'first');
  state(iCardDrawn     ) = state(iCardDrawn     ) - 1; % One less card in the draw pile
  state(iCardDrawn + 17) = state(iCardDrawn + 17) + 1; % One more card on the table

  isBlank = ismember(iCardDrawn,[1 5 10 14]);
  if isBlank && ~drawnOnCrit && nRedrawTokens > 0
    nRedrawTokens = nRedrawTokens - 1;
    [state, nRedrawTokens] = drawCard(state, nRedrawTokens, fullDeck, colorIdxs, resolveCritsImmediately, drawnOnCrit);
  elseif isBlank && ~drawnOnCrit
    state(35) = state(35) + 1;
  end
  
  isCrit = ismember(iCardDrawn,[4 9 13 17]);
  if isCrit && resolveCritsImmediately
    [state, nRedrawTokens] = drawCard(state, nRedrawTokens, fullDeck, colorIdxs, resolveCritsImmediately, true);
  end
end