import { AssetNavigatorOption } from "../../lib/types/AssetNavigator";

export const baseSensors: AssetNavigatorOption[] = [
  { 
    label: 'Supply Temperature',  
    description: 'AHU supply temperature sensor',  
    value: 'sensor/supply-temp' 
  },
  { 
    label: 'Return Temperature',  
    description: 'AHU return temperature sensor',  
    value: 'sensor/return-temp' 
  },
  { 
    label: 'Air Flow',           
    description: 'AHU air flow meter',              
    value: 'sensor/air-flow'
  },
  { 
    label: 'Humidity',            
    description: 'Relative humidity sensor',        
    value: 'sensor/humidity' 
  },
  { 
    label: 'Pressure',            
    description: 'Differential pressure sensor',    
    value: 'sensor/pressure' 
  },
];