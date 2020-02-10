import { Controller, Get, Query } from '@nestjs/common';
import axios from 'axios';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

const baseUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?';
const queryBaseUrl = 'https://maps.googleapis.com/maps/api/place/queryautocomplete/json?';
const geocodeBaseUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=';
// const placeSearchBaseUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';


@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('google-doctors')
  async getTest(@Query('s') s: string, @Query('l') l: string): Promise<any> {
    const GOOGLE_API_KEY = this.configService.get<string>('GOOGLE_API_KEY');

    try {
      // TODO: Handle Non 200 Case && Refactor to separate method
      const locationResults = await axios.get(`${geocodeBaseUrl}${l}&key=${GOOGLE_API_KEY}`);
      const { lat, lng } = locationResults.data.results[0].geometry.location;
      const response = await axios.get(`${baseUrl}&input=${s}&key=${GOOGLE_API_KEY}&location=${lat},${lng}&language=en&types=establishment&radius=20000`)

      if (response.status === 200) {
        return response.data;
      } else {
        // handle error state
        return 'Something went wrong';
      }
    } catch (err) {
      // handle error state
      return 'Something went wrong';
    }
  }

  @Get('query-doctors')
  async getResults(@Query('s') s: string, @Query('l') l: string): Promise<any> {
    const GOOGLE_API_KEY = this.configService.get<string>('GOOGLE_API_KEY');

    try {
      // TODO: Handle Non 200 Case && Refactor to separate method
      const locationResults = await axios.get(`${geocodeBaseUrl}${l}&key=${GOOGLE_API_KEY}`);
      const { lat, lng } = locationResults.data.results[0].geometry.location;
      const response = await axios.get(`${queryBaseUrl}&input=${s}&key=${GOOGLE_API_KEY}&location=${lat},${lng}&language=en&radius=20000`);
      
      if (response.status === 200) {
        return response.data;
      } else {
        return 'Something went wrong';
      }
    } catch (err) {
      return 'Something went wrong'
    }
  }
}