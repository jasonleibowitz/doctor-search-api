import { Controller, Get, Query } from '@nestjs/common';
import axios from 'axios';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { response } from 'express';

const baseUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?';
const geocodeBaseUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=';
const detailBaseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
const ribbonBaseUrl = 'https://api.ribbonhealth.com/v1/custom/providers';

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

  /**
   * Search the Google Autocomplete API
   * @param {String} s - The search term to pass as the input to google
   * @param {String} l [undefined] - The location to search within. This location is passed to Google' geocode API to get a lat,lng to use in the autocomplete API. If not provided, search within the US.
   */
  @Get('google-doctors')
  async getTest(@Query('s') s: string, @Query('l') l: string): Promise<any> {
    const GOOGLE_API_KEY = this.configService.get<string>('GOOGLE_API_KEY');

    try {
      
      // If no location is provided, search within the US
      let locationSearch = '&components=country:us';
      if (l != null)  {
        // TODO: Handle Non 200 Case && Refactor to separate method
        const locationResults = await axios.get(`${geocodeBaseUrl}${l}&key=${GOOGLE_API_KEY}`);
        const { lat, lng } = locationResults.data.results[0].geometry.location;
        locationSearch = `&location=${lat},${lng}`;
      }
      
      const response = await axios.get(`${baseUrl}&input=${s}&key=${GOOGLE_API_KEY}${locationSearch}&language=en&types=establishment&radius=20000`)

      if (response.status === 200) {
        return response.data.predictions.filter(result => result.types.includes('doctor') || result.types.includes('dentist') || result.types.includes('health') || result.types.includes('veterinary_care') || result.types.includes('physiotherapist'));
      } else {
        // handle error state
        console.log(Object.keys(response))
        return `Something went wrong. Status: ${response.status}`;
      }
    } catch (err) {
      // handle error state
      return `Something went wrong. ${err.message}`;
    }
  }

  /**
   * Query the Google Places Detail API for specific place information
   * @param {String} placeId - Google Place ID
   */
  @Get('place-detail')
  async getDetail(@Query('placeId') placeId: string): Promise<any> {
    const GOOGLE_API_KEY = this.configService.get<string>('GOOGLE_API_KEY');

    try {
      const detailResults = await axios.get(`${detailBaseUrl}?place_id=${placeId}&key=${GOOGLE_API_KEY}`);
      if (detailResults.status === 200) {
        return detailResults.data;
      } else {
        return 'Something went wrong';
      }
    } catch (err) {
      return 'Something went wrong'
    }
  }

  /**
   * Query the Ribbon API for Doctors
   * @param {String} s - Search Term
   * @param {String} l [undefined] - Location. If not provided, search within the US  
   */
  @Get('ribbon-search')
  async getRibbonDoctors(@Query('s') s: string, @Query('l') l: string): Promise<any> {
    const RIBBON_API_KEY = this.configService.get<string>('RIBBON_API_KEY');
    const searchLocation = l != null ? `address=${l}` : '';
    const ribbonUrl = `${ribbonBaseUrl}?name=${s}${searchLocation}`;

    try {
      const results = await axios({
        method: 'get',
        url: ribbonUrl,
        headers: {
          Authorization: `Token ${RIBBON_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      if (results.status === 200) {
        return results.data;
      } else {
        return `Received non-200 status: ${results}`;
      }
    } catch (err) {
      return err;
    }
  }
}
