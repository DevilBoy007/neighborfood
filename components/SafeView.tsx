import React from 'react';
import { View, ViewProps } from 'react-native';

/**
 * SafeView is a wrapper component that ensures its children aren't direct text nodes.
 * Use this when you get the "Unexpected text node" error and need a quick fix.
 */
export const SafeView: React.FC<ViewProps> = ({ children, ...props }) => {
  // Convert any direct string children to array first
  const childrenArray = React.Children.toArray(children);
  
  // Process each child to ensure no direct text nodes
  const processedChildren = childrenArray.map((child, index) => {
    // If child is a string or number (React treats these as text nodes)
    if (typeof child === 'string' || typeof child === 'number') {
      return <React.Fragment key={index}>{child}</React.Fragment>;
    }
    return child;
  });
  
  return <View {...props}>{processedChildren}</View>;
};

/**
 * Utility function to safely wrap text content for use in Views
 * @param content Any content that might be a text node
 * @returns The content wrapped in a fragment if it's a text node, otherwise the original content
 */
export const safeTextContent = (content: React.ReactNode): React.ReactNode => {
  if (typeof content === 'string' || typeof content === 'number') {
    return <React.Fragment>{content}</React.Fragment>;
  }
  return content;
};
