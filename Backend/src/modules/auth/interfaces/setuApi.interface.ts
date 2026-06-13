export interface ISetuInitiateResponse {
  id: string;
  url: string;
}

interface ISetuDigilockerDetails {
  digilockerId: string;
  phoneNumber: string;
}

export interface ISetuStatusResponse {
  status: 'authenticated' | 'pending' | 'failed';
  digilockerUserDetails?: ISetuDigilockerDetails;
}
