import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors, TextSizes } from './Theme';

const Small: React.FC<TextProps> = ({ style, children, ...rest }) => {
  return (
    <Text
      style={[{ fontSize: TextSizes.small, color: Colors.textLight }, style]}
      {...rest}
    >
      {children}
    </Text>
  )
}

const Regular: React.FC<TextProps> = ({ style, children, ...rest }) => {
  return (
    <Text
      style={[{ fontSize: TextSizes.regular, color: Colors.text }, style]}
      {...rest}
    >
      {children}
    </Text>
  )
}

const Medium: React.FC<TextProps> = ({ style, children, ...rest }) => {
  return (
    <Text
      style={[{ fontSize: TextSizes.medium, color: Colors.text }, style]}
      {...rest}
    >
      {children}
    </Text>
  )
}

const Large: React.FC<TextProps> = ({ style, children, ...rest }) => {
  return (
    <Text
      style={[{ fontSize: TextSizes.large, color: Colors.text }, style]}
      {...rest}
    >
      {children}
    </Text>
  )
}

const Heading: React.FC<TextProps> = ({ style, children, ...rest }) => {
  return (
    <Text
      style={[{ fontSize: TextSizes.heading, color: Colors.text }, style]}
      {...rest}
    >
      {children}
    </Text>
  )
}

export default {
  Small,
  Regular,
  Medium,
  Large,
  Heading
};