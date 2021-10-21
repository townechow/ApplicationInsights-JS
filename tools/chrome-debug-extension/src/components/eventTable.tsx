// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import { objForEachKey } from '@microsoft/applicationinsights-core-js';
import React from 'react';
import { IColumn, IConfiguration } from '../configuration/IConfiguration';
import { applyConverter, getDynamicFieldValue } from '../dataSources/dataHelpers';
import { IDataEvent } from '../dataSources/IDataEvent';
import { EventTypeIcon } from './eventTypeIcon';

interface IEventTableProps {
  dataEvents: IDataEvent[];
  configuration: IConfiguration;
  selectedIndex: number | undefined;
  // tslint:disable-next-line:no-any
  onRowClickHandler: any;
}

// Issues:
// 1. current logic is to reset props.dataEvents when user clicks new row. This causes two issues: 1) previous children are lost 2) can't open childEvts of childEvts
// Ideas:
// 1. add new section "middle" to display childEvts 2. (how) to record current status of which childEvts are opened, etc (index messed up)
export const EventTable = (props: IEventTableProps): React.ReactElement<IEventTableProps> => {
  const [dataEvents, setDataEvents] = React.useState<IDataEvent[]>(props.dataEvents);
  // const [index, setIndex] = React.useState<number>(props.dataEvents.length);
  const [childDataEvents, setChildDataEvents] = React.useState<IDataEvent>();
  const [preSelectIdx, setPreSelectIdx] = React.useState<any>();
  React.useEffect(() => {
    let tmp = props.dataEvents.slice(0);
    if (childDataEvents !== undefined && childDataEvents !== null && props.selectedIndex === preSelectIdx) {
      tmp.splice(props.selectedIndex as number + 1, 0, childDataEvents);
    }
    // let pre = dataEvents.slice(0);
    // setDataEvents(pre.concat(tmp));
    // setIndex(props.dataEvents.length);
    setDataEvents(tmp);
  }, [props.dataEvents]);

  React.useEffect(() => {
    let tmp = props.dataEvents.slice(0);
    setDataEvents(tmp);
  }, [props.selectedIndex]);

  // Not state because we want these to be per-render
  const deltaColumnsPreviousValues = new Map<number, number | undefined>();
  let lastSessionNumber: string | undefined = undefined;

  function onClick(e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) {
    props.onRowClickHandler(e);
    setPreSelectIdx(props.selectedIndex);
    if (props.dataEvents !== undefined && props.selectedIndex !== undefined) {
      let childEvts = props.dataEvents[props.selectedIndex] && props.dataEvents[props.selectedIndex]["data"] && props.dataEvents[props.selectedIndex]["data"]["childEvts"];
      if (childEvts !== undefined) {
        objForEachKey(childEvts, (idx: string) => {
          let child: IDataEvent = childEvts[idx];
          setChildDataEvents(child);
          let tmp = dataEvents.slice(0);
          tmp.splice(props.selectedIndex as number + 1, 0, child);
          // tmp.push(child);
          setDataEvents(tmp);
        });
      }
    }
  }

  return (
    <div className='eventTableDiv'>
      <table className='eventTable'>
        <thead>
          <tr key='Header_Row'>
            <th key='Header_-1'>&nbsp;</th>
            {
              // Render the column headers based on the configuration
              props.configuration.columnsToDisplay.map((columnToDisplay: IColumn, index: number) => {
                return <th key={`Header_${index}`}>{columnToDisplay.header}</th>;
              })
            }
          </tr>
        </thead>
        <tbody>
          {dataEvents.map((dataEvent: IDataEvent, rowIndex: number) => {
            const isNewSession =
              lastSessionNumber !== undefined && dataEvent.sessionNumber !== lastSessionNumber;

            // Don't remember any column previous values between sessions
            if (isNewSession) {
              deltaColumnsPreviousValues.clear();
            }

            // Build up the row's cells based on the configuration
            const cells = new Array<JSX.Element>();
            props.configuration.columnsToDisplay.map((columnToDisplay: IColumn, columnIndex: number) => {
              switch (columnToDisplay.type) {
                case 'SessionNumber':
                  {
                    cells.push(<td key={`Row_${rowIndex}_Td_${columnIndex}`}>{dataEvent.sessionNumber}</td>);
                  }
                  break;
                case 'NumberDelta':
                  {
                    const previousValue = deltaColumnsPreviousValues.get(columnIndex);
                    const currentStringValue = getDynamicFieldValue(
                      dataEvent,
                      columnToDisplay.prioritizedFieldNames
                    );
                    const currentValue = currentStringValue
                      ? Number.parseInt(currentStringValue, 10)
                      : undefined;

                    let numberToDisplay: number | undefined = undefined;

                    if (previousValue && currentValue) {
                      numberToDisplay = currentValue - previousValue;
                    }
                    deltaColumnsPreviousValues.set(columnIndex, currentValue);

                    cells.push(
                      <td key={`Row_${rowIndex}_Td_${columnIndex}`}>
                        {applyConverter(
                          numberToDisplay ? numberToDisplay.toString() : undefined,
                          'TruncateWithDigitGrouping'
                        )}
                      </td>
                    );
                  }
                  break;
                case 'NormalData':
                default: {
                  cells.push(
                    <td key={`Row_${rowIndex}_Td_${columnIndex}`}>
                      {getDynamicFieldValue(dataEvent, columnToDisplay.prioritizedFieldNames)}
                    </td>
                  );
                }
              }
            });

            // Determine the CSS classname to use for the row
            let className = rowIndex === props.selectedIndex ? 'selected' : '';
            if (isNewSession) {
              className += ' newSessionRow';
            }
            lastSessionNumber = dataEvent.sessionNumber;

            // Render the row
            return (
              <tr
                key={`Row_${rowIndex}`}
                item-data={rowIndex}
                className={className}
                onClick={(props.dataEvents !== undefined && props.selectedIndex !== undefined) ? (e) => onClick(e) : props.onRowClickHandler}
              >
                <td key={`Row_${rowIndex}_Td_-1`}>
                  <EventTypeIcon eventType={dataEvent.type} suppress={['appLogic']} />
                </td>
                {cells}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
