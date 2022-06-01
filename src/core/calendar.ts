import config from '../../config.json';
import fs from 'fs';
import { google } from 'googleapis';
import readline from 'readline'
import { Event } from '../entities/event';

export class Calendar {
    private static TOKEN_PATH = './token.json'
    private static SCOPES = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
    ];

    private authorize(credentials: any, callback: Function) {
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        fs.readFile(Calendar.TOKEN_PATH, (err: any, token: any) => {
            if (err) {
                return this.getAccessToken(oAuth2Client, callback);
            }
            oAuth2Client.setCredentials(JSON.parse(token));
            callback(oAuth2Client);
        });
    }

    private getAccessToken(oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: Calendar.SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(Calendar.TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) return console.error(err);
                    console.log('Token stored to', Calendar.TOKEN_PATH);
                });
                callback(oAuth2Client);
            });
        });
    }

    public listCalendars(): Promise<any> {
        return new Promise((resolve, reject) => {
            fs.readFile('./credentials.json', (err: any, content: any) => {
                if (err) {
                    reject(err);
                }
                // Authorize a client with credentials, then call the Google Calendar API.
                this.authorize(JSON.parse(content), (auth: any) => {
                    const calendar = google.calendar({ version: 'v3', auth });
                    calendar.calendarList.list({}, (err, res) => {
                        if (err) {
                            reject(err);
                        }
                        return resolve(res.data);
                    });
                });
            });
        });
    }

    public listEvents(
        maxResults: number = 5,
        timeMin: string = undefined, // dateime
        timeMax: string = undefined, // dateime
    ): Promise<Event[]> {
        return new Promise((resolve, reject) => {
            fs.readFile('./credentials.json', (err: any, content: any) => {
                if (err) {
                    reject(err);
                }
                // Authorize a client with credentials, then call the Google Calendar API.
                this.authorize(JSON.parse(content), (auth: any) => {
                    const calendar = google.calendar({ version: 'v3', auth });
                    const options = {
                        calendarId: config.calendarId,
                        maxResults: maxResults,
                        timeMin: timeMin,
                        timeMax: timeMax,
                        singleEvents: true,
                        orderBy: 'startTime',
                    };
                    calendar.events.list(options, (err, res) => {
                        if (err) {
                            reject(err);
                        }
                        // Lets filter events that start and end within timeMin and timeMax
                        if (res?.data?.items) {
                            resolve(res.data.items.filter((event: Event) => {
                                const timeMinLocal = new Date((new Date(timeMin)).toLocaleString('en-US', {
                                    timeZone: config.timezone
                                }));
                                const startTimeLocal = new Date((new Date(event.start.dateTime)).toLocaleString('en-US', {
                                    timeZone: config.timezone
                                }));
                                const timeMaxLocal = new Date((new Date(timeMax)).toLocaleString('en-US', {
                                    timeZone: config.timezone
                                }));
                                const endTimeLocal = new Date((new Date(event.end.dateTime)).toLocaleString('en-US', {
                                    timeZone: config.timezone
                                }));
                                
                                if (startTimeLocal >= timeMinLocal &&
                                    endTimeLocal <= timeMaxLocal
                                ) {
                                    return event;
                                }
                            }))
                        } else {
                            resolve([]);
                        }
                    });
                });
            });
        });
    }

    public updateEvent(id: string, description: string): Promise<Event> {
        return new Promise((resolve, reject) => {
            fs.readFile('./credentials.json', (err: any, content: any) => {
                if (err) {
                    reject(err);
                }
                // Authorize a client with credentials, then call the Google Calendar API.
                this.authorize(JSON.parse(content), (auth: any) => {
                    const calendar = google.calendar({ version: 'v3', auth });
                    calendar.events.patch({
                        calendarId: config.calendarId,
                        eventId: id,
                        requestBody: {
                            description: description
                        }
                    }, (err, res) => {
                        if (err) {
                            reject(err);
                        }
                        resolve(null);
                    });
                });
            });
        });
    }
}