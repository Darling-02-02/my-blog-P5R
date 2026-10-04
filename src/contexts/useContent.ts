import { useContext } from 'react';
import { ContentContext } from './content-context';

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent must be used within ContentProvider');
  return context;
};
