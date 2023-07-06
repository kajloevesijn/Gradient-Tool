import React from 'react'

export const ColorPickerButton = (props) => {
  const colorCode = `${props.color[0]},${props.color[1]},${props.color[2]}`;

  return (
    <div className=''>

      <div className='flex gap-2'>
        <div style={{ backgroundColor: `rgb(${colorCode})` }} className={`w-7 bg rounded-md ring-2 ring-white`}></div>
        <button onClick={props.openPicker} className='duration-200 w-full hover:shadow-md rounded-md ring-2 ring-gray-500 hover:bg-slate-700 hover:ring-gray-100 bg-slate-800'>{props.buttonText}</button>
      </div>

    </div>
  )
}
