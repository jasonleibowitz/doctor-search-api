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
   * @param {String} l - The location to search within. This location is passed to Google' geocode API to get a lat,lng to use in the autocomplete API 
   */
  @Get('google-doctors')
  async getTest(@Query('s') s: string, @Query('l') l: string): Promise<any> {
    const GOOGLE_API_KEY = this.configService.get<string>('GOOGLE_API_KEY');
    console.log('/// GOOGLE_API_KEY', GOOGLE_API_KEY);
    console.log('/// process.env', process.env);

    try {
      // TODO: Handle Non 200 Case && Refactor to separate method
      const locationResults = await axios.get(`${geocodeBaseUrl}${l}&key=${GOOGLE_API_KEY}`);
      console.log('/// locationResults', locationResults.data.error_message);
      const { lat, lng } = locationResults.data.results[0].geometry.location;
      const response = await axios.get(`${baseUrl}&input=${s}&key=${GOOGLE_API_KEY}&location=${lat},${lng}&language=en&types=establishment&radius=20000`)

      if (response.status === 200) {
        return response.data;
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

  @Get('ribbon-search')
  async getRibbonDoctors(@Query('q') q: string): Promise<any> {
    const RIBBON_API_KEY = this.configService.get<string>('RIBBON_API_KEY');
    const ribbonUrl = `${ribbonBaseUrl}?name=${q}`;

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
