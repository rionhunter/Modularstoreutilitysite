import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Calculator, Delete } from 'lucide-react';

export function CalculatorModule() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue;
      let newValue = currentValue;

      switch (operation) {
        case '+':
          newValue = currentValue + inputValue;
          break;
        case '-':
          newValue = currentValue - inputValue;
          break;
        case '*':
          newValue = currentValue * inputValue;
          break;
        case '/':
          newValue = currentValue / inputValue;
          break;
        case '=':
          newValue = inputValue;
          break;
      }

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const buttonClass = "h-12 text-lg";
  const operationButtonClass = "h-12 text-lg bg-primary/10 hover:bg-primary/20";
  const equalsButtonClass = "h-12 text-lg bg-primary hover:bg-primary/90";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Display */}
        <div className="bg-muted rounded-lg p-4 text-right">
          <div className="text-3xl font-mono break-all">{display}</div>
          {operation && previousValue !== null && (
            <div className="text-xs text-muted-foreground mt-1">
              {previousValue} {operation}
            </div>
          )}
        </div>

        {/* Calculator Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <Button
            variant="outline"
            className={buttonClass}
            onClick={clear}
          >
            C
          </Button>
          <Button
            variant="outline"
            className={buttonClass}
            onClick={() => setDisplay(String(parseFloat(display) * -1))}
          >
            ±
          </Button>
          <Button
            variant="outline"
            className={buttonClass}
            onClick={() => setDisplay(String(parseFloat(display) / 100))}
          >
            %
          </Button>
          <Button
            variant="outline"
            className={operationButtonClass}
            onClick={() => performOperation('/')}
          >
            ÷
          </Button>

          {/* Row 2 */}
          <Button variant="outline" className={buttonClass} onClick={() => inputDigit('7')}>7</Button>
          <Button variant="outline" className={buttonClass} onClick={() => inputDigit('8')}>8</Button>
          <Button variant="outline" className={buttonClass} onClick={() => inputDigit('9')}>9</Button>
          <Button
            variant="outline"
            className={operationButtonClass}
            onClick={() => performOperation('*')}
          >
            ×
          </Button>

          {/* Row 3 */}
          <Button variant="outline" className={buttonClass} onClick={() => inputDigit('4')}>4</Button>
          <Button variant="outline" className={buttonClass} onClick={() => inputDigit('5')}>5</Button>
          <Button variant="outline" className={buttonClass} onClick={() => inputDigit('6')}>6</Button>
          <Button
            variant="outline"
            className={operationButtonClass}
            onClick={() => performOperation('-')}
          >
            −
          </Button>

          {/* Row 4 */}
          <Button variant="outline" className={buttonClass} onClick={() => inputDigit('1')}>1</Button>
          <Button variant="outline" className={buttonClass} onClick={() => inputDigit('2')}>2</Button>
          <Button variant="outline" className={buttonClass} onClick={() => inputDigit('3')}>3</Button>
          <Button
            variant="outline"
            className={operationButtonClass}
            onClick={() => performOperation('+')}
          >
            +
          </Button>

          {/* Row 5 */}
          <Button
            variant="outline"
            className={`${buttonClass} col-span-2`}
            onClick={() => inputDigit('0')}
          >
            0
          </Button>
          <Button variant="outline" className={buttonClass} onClick={inputDecimal}>.</Button>
          <Button
            variant="default"
            className={equalsButtonClass}
            onClick={() => performOperation('=')}
          >
            =
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
