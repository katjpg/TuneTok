import styled from 'styled-components/native';

interface Props {
  home: boolean;
}

export const Container = styled.View`
  bottom: 2px;
  width: 60px;
  height: 45px;
  justify-content: center;
  border-radius: 120px;
  align-items: center;
  background: ${(props: Props) => (props.home ? '#000' : '#000')};
  border-left-width: 5px;
  border-left-color: #20d5ea;
  border-right-width: 5px;
  border-right-color: #ec376d;
`;

export const Button = styled.TouchableOpacity.attrs({
  activeOpacity: 1,
})``;
