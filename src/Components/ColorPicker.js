import React, { useState } from 'react';
import { SketchPicker } from 'react-color';

export const ColorPicker = (props) => {
  const [color, setColor] = useState(`rgb(${props.currentColor[0]},${props.currentColor[1]},${props.currentColor[2]})`);

  const handleChange = (newColor) => {
    props.colorChanged(newColor.rgb);
    setColor(newColor.rgb);
  };

  return (
    <SketchPicker
      color={color}
      onChange={handleChange}
    />
  );
}