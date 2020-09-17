export const namesMap = {
  US: 'United States',
  'Korea, South': 'South Korea',
  'Bahamas, The': 'Bahamas',
  [`Cote d'Ivoire`]: 'Ivory Coast',
  'Gambia, The': 'Gambia',
  'Taiwan*': 'Taiwan',
};
export const swapName = (name: string): string => {
  if (!Object.keys(namesMap).includes(name)) {
    return name;
  }
  return namesMap[name];
};
