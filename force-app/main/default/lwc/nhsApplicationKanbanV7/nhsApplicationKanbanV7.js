import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import getApplicationKanbanData from '@salesforce/apex/NhsApplicationKanbanController.getApplicationKanbanData';
import getAssigneeList          from '@salesforce/apex/NhsApplicationKanbanController.getAssigneeList';
import getHouseBuilderOptions   from '@salesforce/apex/NhsApplicationKanbanController.getHouseBuilderOptions';
import updateOpportunityStage   from '@salesforce/apex/NhsApplicationKanbanController.updateOpportunityStage';
import archiveOpportunity       from '@salesforce/apex/NhsApplicationKanbanController.archiveOpportunity';
import togglePin from '@salesforce/apex/NhsApplicationKanbanController.togglePin';
import updateCardOrder from '@salesforce/apex/NhsApplicationKanbanController.updateCardOrder';
import loadMoreCards from '@salesforce/apex/NhsApplicationKanbanController.loadMoreCards';
import getAccountFileUrl from '@salesforce/apex/houseBuilderApplication.getAccountFileUrl';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';

/* ── Top-level stage nav ─────────────────────────────────────────────── */
const TOP_STAGES = [
    { key: 'application',         label: 'Applications',        colour: '#93c5fd', num: '1' },
    { key: 'vendor_availability', label: 'Vendor Availability', colour: '#93c5fd', num: '2' },
    { key: 'agents_booked',       label: 'Book Agents',          colour: '#93c5fd', num: '3' },
    { key: 'figures_to_chase',    label: 'Figures to Chase',    colour: '#93c5fd', num: '4' },
    { key: 'valuations_ready',    label: 'Valuations Ready',    colour: '#93c5fd', num: '5' },
    { key: 'figures_returned',    label: 'Figures Returned',    colour: '#93c5fd', num: '6' },
    { key: 'archived',            label: 'Archived',            colour: '#93c5fd', num: '7' },
];

/* ── Kanban helpers ──────────────────────────────────────────────────── */
const PILL_STYLES = {
    'to be contacted': { bg:'#eef2ff', text:'#4338ca', border:'#c7d2fe' },
    '1st contact':     { bg:'#f0f9ff', text:'#0369a1', border:'#bae6fd' },
    '2nd contact':     { bg:'#fffbeb', text:'#b45309', border:'#fde68a' },
    '3rd contact':     { bg:'#fff7ed', text:'#c2410c', border:'#fed7aa' },
    'sale cancelled': { bg:'#fef2f2', text:'#b91c1c', border:'#fecaca' },
};
const SUB_COLOURS = {
    'to be contacted': '#6366f1', '1st contact': '#0ea5e9',
    '2nd contact': '#f59e0b', '3rd contact': '#f97316', 'sale cancelled': '#ef4444',
};
const AV_COLS = [
    {bg:'#DCE8FF',t:'#1A4FCC'},{bg:'#E1F5EE',t:'#0F6E56'},
    {bg:'#FAEEDA',t:'#854F0B'},{bg:'#FAECE7',t:'#993C1D'},
    {bg:'#EEEDFE',t:'#3C3489'},{bg:'#E8F8FA',t:'#006978'},
];
const fmt  = n => !n ? null : n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(0)+'k' : String(n);
const ini  = n => n ? n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
const avSt = n => { if(!n) return 'background:#f3f4f6;color:#374151;'; const i=n.split('').reduce((s,c)=>s+c.charCodeAt(0),0)%AV_COLS.length; return `background:${AV_COLS[i].bg};color:${AV_COLS[i].t};`; };
const fmtD = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : null;
const stageColour = n => n ? (SUB_COLOURS[n.toLowerCase()] || '#6b7280') : '#6b7280';

/* ── Vendor Availability data ────────────────────────────────────────── */
const VA_VENDORS = [
    { "id": 1, "name": "Margaret Holloway 1", "address": "1 Elm Grove, Leeds", "status": "available", "phone": "07700 900101", "email": "margaret.holloway1@mail.co.uk", "property": "3-bed semi", "price": "£228,000", "calls": 3, "agent": "Nina P." },
    { "id": 2, "name": "Robert Ashworth 2", "address": "2 Park Lane, Harrogate", "status": "pending", "phone": "07700 900102", "email": "robert.ashworth2@mail.co.uk", "property": "3-bed semi", "price": "£155,000", "calls": 2, "agent": "James T." },
    { "id": 3, "name": "Priya Sharma 3", "address": "3 Victoria Rd, Bradford", "status": "available", "phone": "07700 900103", "email": "priya.sharma3@mail.co.uk", "property": "3-bed semi", "price": "£621,000", "calls": 5, "agent": "Sarah K." },
    { "id": 4, "name": "David Whitfield 4", "address": "4 Maple Close, Otley", "status": "pending", "phone": "07700 900104", "email": "david.whitfield4@mail.co.uk", "property": "5-bed detached", "price": "£242,000", "calls": 4, "agent": "Sarah K." },
    { "id": 5, "name": "Susan Bancroft 5", "address": "5 High Street, Skipton", "status": "pending", "phone": "07700 900105", "email": "susan.bancroft5@mail.co.uk", "property": "5-bed detached", "price": "£161,000", "calls": 4, "agent": "Nina P." },
    { "id": 6, "name": "James Patel 6", "address": "6 Beech Ave, Wakefield", "status": "pending", "phone": "07700 900106", "email": "james.patel6@mail.co.uk", "property": "2-bed terrace", "price": "£302,000", "calls": 4, "agent": "Nina P." },
    { "id": 7, "name": "Claire Donaldson 7", "address": "7 Oak Terrace, Wetherby", "status": "unavailable", "phone": "07700 900107", "email": "claire.donaldson7@mail.co.uk", "property": "3-bed semi", "price": "£431,000", "calls": 4, "agent": "Nina P." },
    { "id": 8, "name": "Tom Greenwood 8", "address": "8 Rose Lane, Castleford", "status": "available", "phone": "07700 900108", "email": "tom.greenwood8@mail.co.uk", "property": "4-bed detached", "price": "£612,000", "calls": 2, "agent": "Nina P." },
    { "id": 9, "name": "Alice Cooper 9", "address": "9 Cherry Way, York", "status": "pending", "phone": "07700 900109", "email": "alice.cooper9@mail.co.uk", "property": "2-bed terrace", "price": "£247,000", "calls": 3, "agent": "Nina P." },
    { "id": 10, "name": "Bob Dylan 10", "address": "10 Birch Rd, Sheffield", "status": "pending", "phone": "07700 900110", "email": "bob.dylan10@mail.co.uk", "property": "3-bed semi", "price": "£641,000", "calls": 3, "agent": "James T." },
    { "id": 11, "name": "Charlie Sheen 11", "address": "11 Pine St, Manchester", "status": "unavailable", "phone": "07700 900111", "email": "charlie.sheen11@mail.co.uk", "property": "2-bed terrace", "price": "£172,000", "calls": 4, "agent": "James T." },
    { "id": 12, "name": "Diana Prince 12", "address": "12 Maple Dr, Liverpool", "status": "available", "phone": "07700 900112", "email": "diana.prince12@mail.co.uk", "property": "3-bed semi", "price": "£338,000", "calls": 4, "agent": "James T." },
    { "id": 13, "name": "Edward Norton 13", "address": "13 Cedar Ln, London", "status": "available", "phone": "07700 900113", "email": "edward.norton13@mail.co.uk", "property": "2-bed terrace", "price": "£155,000", "calls": 5, "agent": "Nina P." },
    { "id": 14, "name": "Fiona Apple 14", "address": "14 Willow Way, Oxford", "status": "unavailable", "phone": "07700 900114", "email": "fiona.apple14@mail.co.uk", "property": "4-bed detached", "price": "£242,000", "calls": 5, "agent": "Sarah K." },
    { "id": 15, "name": "George Clooney 15", "address": "15 Poplar Ave, Cambridge", "status": "pending", "phone": "07700 900115", "email": "george.clooney15@mail.co.uk", "property": "3-bed semi", "price": "£339,000", "calls": 4, "agent": "Sarah K." },
    { "id": 16, "name": "Hannah Montana 16", "address": "16 Elm Grove, Leeds", "status": "unavailable", "phone": "07700 900116", "email": "hannah.montana16@mail.co.uk", "property": "3-bed semi", "price": "£555,000", "calls": 5, "agent": "Sarah K." },
    { "id": 17, "name": "Ian McKellen 17", "address": "17 Park Lane, Harrogate", "status": "pending", "phone": "07700 900117", "email": "ian.mckellen17@mail.co.uk", "property": "2-bed terrace", "price": "£620,000", "calls": 2, "agent": "Nina P." },
    { "id": 18, "name": "Julia Roberts 18", "address": "18 Victoria Rd, Bradford", "status": "available", "phone": "07700 900118", "email": "julia.roberts18@mail.co.uk", "property": "2-bed terrace", "price": "£637,000", "calls": 0, "agent": "Sarah K." },
    { "id": 19, "name": "Kevin Hart 19", "address": "19 Maple Close, Otley", "status": "available", "phone": "07700 900119", "email": "kevin.hart19@mail.co.uk", "property": "2-bed terrace", "price": "£228,000", "calls": 4, "agent": "James T." },
    { "id": 20, "name": "Laura Dern 20", "address": "20 High Street, Skipton", "status": "pending", "phone": "07700 900120", "email": "laura.dern20@mail.co.uk", "property": "3-bed semi", "price": "£519,000", "calls": 3, "agent": "James T." },
    { "id": 21, "name": "Morgan Freeman 21", "address": "21 Beech Ave, Wakefield", "status": "pending", "phone": "07700 900121", "email": "morgan.freeman21@mail.co.uk", "property": "3-bed semi", "price": "£206,000", "calls": 3, "agent": "James T." },
    { "id": 22, "name": "Natalie Portman 22", "address": "22 Oak Terrace, Wetherby", "status": "available", "phone": "07700 900122", "email": "natalie.portman22@mail.co.uk", "property": "4-bed detached", "price": "£622,000", "calls": 5, "agent": "James T." },
    { "id": 23, "name": "Oscar Wilde 23", "address": "23 Rose Lane, Castleford", "status": "pending", "phone": "07700 900123", "email": "oscar.wilde23@mail.co.uk", "property": "2-bed terrace", "price": "£186,000", "calls": 5, "agent": "Sarah K." },
    { "id": 24, "name": "Penelope Cruz 24", "address": "24 Cherry Way, York", "status": "pending", "phone": "07700 900124", "email": "penelope.cruz24@mail.co.uk", "property": "2-bed terrace", "price": "£378,000", "calls": 4, "agent": "James T." },
    { "id": 25, "name": "Quentin Tarantino 25", "address": "25 Birch Rd, Sheffield", "status": "pending", "phone": "07700 900125", "email": "quentin.tarantino25@mail.co.uk", "property": "5-bed detached", "price": "£243,000", "calls": 3, "agent": "Sarah K." },
    { "id": 26, "name": "Margaret Holloway 26", "address": "26 Pine St, Manchester", "status": "available", "phone": "07700 900126", "email": "margaret.holloway26@mail.co.uk", "property": "2-bed terrace", "price": "£512,000", "calls": 0, "agent": "Nina P." },
    { "id": 27, "name": "Robert Ashworth 27", "address": "27 Maple Dr, Liverpool", "status": "pending", "phone": "07700 900127", "email": "robert.ashworth27@mail.co.uk", "property": "3-bed semi", "price": "£161,000", "calls": 2, "agent": "James T." },
    { "id": 28, "name": "Priya Sharma 28", "address": "28 Cedar Ln, London", "status": "available", "phone": "07700 900128", "email": "priya.sharma28@mail.co.uk", "property": "4-bed detached", "price": "£239,000", "calls": 5, "agent": "Sarah K." },
    { "id": 29, "name": "David Whitfield 29", "address": "29 Willow Way, Oxford", "status": "pending", "phone": "07700 900129", "email": "david.whitfield29@mail.co.uk", "property": "4-bed detached", "price": "£302,000", "calls": 4, "agent": "Sarah K." },
    { "id": 30, "name": "Susan Bancroft 30", "address": "30 Poplar Ave, Cambridge", "status": "pending", "phone": "07700 900130", "email": "susan.bancroft30@mail.co.uk", "property": "3-bed semi", "price": "£431,000", "calls": 4, "agent": "Nina P." },
    { "id": 31, "name": "James Patel 31", "address": "31 Elm Grove, Leeds", "status": "pending", "phone": "07700 900131", "email": "james.patel31@mail.co.uk", "property": "3-bed semi", "price": "£612,000", "calls": 4, "agent": "Nina P." },
    { "id": 32, "name": "Claire Donaldson 32", "address": "32 Park Lane, Harrogate", "status": "unavailable", "phone": "07700 900132", "email": "claire.donaldson32@mail.co.uk", "property": "2-bed terrace", "price": "£621,000", "calls": 4, "agent": "Nina P." },
    { "id": 33, "name": "Tom Greenwood 33", "address": "33 Victoria Rd, Bradford", "status": "available", "phone": "07700 900133", "email": "tom.greenwood33@mail.co.uk", "property": "3-bed semi", "price": "£556,000", "calls": 2, "agent": "Nina P." },
    { "id": 34, "name": "Alice Cooper 34", "address": "34 Maple Close, Otley", "status": "pending", "phone": "07700 900134", "email": "alice.cooper34@mail.co.uk", "property": "3-bed semi", "price": "£247,000", "calls": 3, "agent": "Nina P." },
    { "id": 35, "name": "Bob Dylan 35", "address": "35 High Street, Skipton", "status": "pending", "phone": "07700 900135", "email": "bob.dylan35@mail.co.uk", "property": "2-bed terrace", "price": "£641,000", "calls": 3, "agent": "James T." },
    { "id": 36, "name": "Charlie Sheen 36", "address": "36 Beech Ave, Wakefield", "status": "unavailable", "phone": "07700 900136", "email": "charlie.sheen36@mail.co.uk", "property": "4-bed detached", "price": "£172,000", "calls": 4, "agent": "James T." },
    { "id": 37, "name": "Diana Prince 37", "address": "37 Oak Terrace, Wetherby", "status": "available", "phone": "07700 900137", "email": "diana.prince37@mail.co.uk", "property": "3-bed semi", "price": "£338,000", "calls": 4, "agent": "James T." },
    { "id": 38, "name": "Edward Norton 38", "address": "38 Rose Lane, Castleford", "status": "available", "phone": "07700 900138", "email": "edward.norton38@mail.co.uk", "property": "2-bed terrace", "price": "£155,000", "calls": 5, "agent": "Nina P." },
    { "id": 39, "name": "Fiona Apple 39", "address": "39 Cherry Way, York", "status": "unavailable", "phone": "07700 900139", "email": "fiona.apple39@mail.co.uk", "property": "4-bed detached", "price": "£242,000", "calls": 5, "agent": "Sarah K." },
    { "id": 40, "name": "George Clooney 40", "address": "40 Birch Rd, Sheffield", "status": "pending", "phone": "07700 900140", "email": "george.clooney40@mail.co.uk", "property": "3-bed semi", "price": "£339,000", "calls": 4, "agent": "Sarah K." },
    { "id": 41, "name": "Hannah Montana 41", "address": "41 Pine St, Manchester", "status": "unavailable", "phone": "07700 900141", "email": "hannah.montana41@mail.co.uk", "property": "3-bed semi", "price": "£555,000", "calls": 5, "agent": "Sarah K." },
    { "id": 42, "name": "Ian McKellen 42", "address": "42 Maple Dr, Liverpool", "status": "pending", "phone": "07700 900142", "email": "ian.mckellen42@mail.co.uk", "property": "2-bed terrace", "price": "£620,000", "calls": 2, "agent": "Nina P." },
    { "id": 43, "name": "Julia Roberts 43", "address": "43 Cedar Ln, London", "status": "available", "phone": "07700 900143", "email": "julia.roberts43@mail.co.uk", "property": "3-bed semi", "price": "£637,000", "calls": 0, "agent": "Sarah K." },
    { "id": 44, "name": "Kevin Hart 44", "address": "44 Willow Way, Oxford", "status": "available", "phone": "07700 900144", "email": "kevin.hart44@mail.co.uk", "property": "3-bed semi", "price": "£228,000", "calls": 4, "agent": "James T." },
    { "id": 45, "name": "Laura Dern 45", "address": "45 Poplar Ave, Cambridge", "status": "pending", "phone": "07700 900145", "email": "laura.dern45@mail.co.uk", "property": "2-bed terrace", "price": "£519,000", "calls": 3, "agent": "James T." },
    { "id": 46, "name": "Morgan Freeman 46", "address": "46 Elm Grove, Leeds", "status": "pending", "phone": "07700 900146", "email": "morgan.freeman46@mail.co.uk", "property": "4-bed detached", "price": "£206,000", "calls": 3, "agent": "James T." },
    { "id": 47, "name": "Natalie Portman 47", "address": "47 Park Lane, Harrogate", "status": "available", "phone": "07700 900147", "email": "natalie.portman47@mail.co.uk", "property": "3-bed semi", "price": "£622,000", "calls": 5, "agent": "James T." },
    { "id": 48, "name": "Oscar Wilde 48", "address": "48 Victoria Rd, Bradford", "status": "pending", "phone": "07700 900148", "email": "oscar.wilde48@mail.co.uk", "property": "3-bed semi", "price": "£186,000", "calls": 5, "agent": "Sarah K." },
    { "id": 49, "name": "Penelope Cruz 49", "address": "49 Maple Close, Otley", "status": "pending", "phone": "07700 900149", "email": "penelope.cruz49@mail.co.uk", "property": "4-bed detached", "price": "£378,000", "calls": 4, "agent": "James T." },
    { "id": 50, "name": "Quentin Tarantino 50", "address": "50 High Street, Skipton", "status": "pending", "phone": "07700 900150", "email": "quentin.tarantino50@mail.co.uk", "property": "4-bed detached", "price": "£243,000", "calls": 3, "agent": "Sarah K." },
    { "id": 51, "name": "Margaret Holloway 51", "address": "51 Beech Ave, Wakefield", "status": "available", "phone": "07700 900151", "email": "margaret.holloway51@mail.co.uk", "property": "2-bed terrace", "price": "£512,000", "calls": 0, "agent": "Nina P." },
    { "id": 52, "name": "Robert Ashworth 52", "address": "52 Oak Terrace, Wetherby", "status": "pending", "phone": "07700 900152", "email": "robert.ashworth52@mail.co.uk", "property": "2-bed terrace", "price": "£161,000", "calls": 2, "agent": "James T." },
    { "id": 53, "name": "Priya Sharma 53", "address": "53 Rose Lane, Castleford", "status": "available", "phone": "07700 900153", "email": "priya.sharma53@mail.co.uk", "property": "2-bed terrace", "price": "£239,000", "calls": 5, "agent": "Sarah K." },
    { "id": 54, "name": "David Whitfield 54", "address": "54 Cherry Way, York", "status": "pending", "phone": "07700 900154", "email": "david.whitfield54@mail.co.uk", "property": "3-bed semi", "price": "£302,000", "calls": 4, "agent": "Sarah K." },
    { "id": 55, "name": "Susan Bancroft 55", "address": "55 Birch Rd, Sheffield", "status": "pending", "phone": "07700 900155", "email": "susan.bancroft55@mail.co.uk", "property": "5-bed detached", "price": "£431,000", "calls": 4, "agent": "Nina P." },
    { "id": 56, "name": "James Patel 56", "address": "56 Pine St, Manchester", "status": "pending", "phone": "07700 900156", "email": "james.patel56@mail.co.uk", "property": "3-bed semi", "price": "£612,000", "calls": 4, "agent": "Nina P." },
    { "id": 57, "name": "Claire Donaldson 57", "address": "57 Maple Dr, Liverpool", "status": "unavailable", "phone": "07700 900157", "email": "claire.donaldson57@mail.co.uk", "property": "5-bed detached", "price": "£621,000", "calls": 4, "agent": "Nina P." },
    { "id": 58, "name": "Tom Greenwood 58", "address": "58 Cedar Ln, London", "status": "available", "phone": "07700 900158", "email": "tom.greenwood8@mail.co.uk", "property": "2-bed terrace", "price": "£556,000", "calls": 2, "agent": "Nina P." },
    { "id": 59, "name": "Alice Cooper 59", "address": "59 Willow Way, Oxford", "status": "pending", "phone": "07700 900159", "email": "alice.cooper59@mail.co.uk", "property": "3-bed semi", "price": "£247,000", "calls": 3, "agent": "Nina P." },
    { "id": 60, "name": "Bob Dylan 60", "address": "60 Poplar Ave, Cambridge", "status": "pending", "phone": "07700 900160", "email": "bob.dylan60@mail.co.uk", "property": "3-bed semi", "price": "£641,000", "calls": 3, "agent": "James T." },
    { "id": 61, "name": "Charlie Sheen 61", "address": "61 Elm Grove, Leeds", "status": "unavailable", "phone": "07700 900161", "email": "charlie.sheen61@mail.co.uk", "property": "3-bed semi", "price": "£172,000", "calls": 4, "agent": "James T." },
    { "id": 62, "name": "Diana Prince 62", "address": "62 Park Lane, Harrogate", "status": "available", "phone": "07700 900162", "email": "diana.prince62@mail.co.uk", "property": "2-bed terrace", "price": "£338,000", "calls": 4, "agent": "James T." },
    { "id": 63, "name": "Edward Norton 63", "address": "63 Victoria Rd, Bradford", "status": "available", "phone": "07700 900163", "email": "edward.norton63@mail.co.uk", "property": "4-bed detached", "price": "£155,000", "calls": 5, "agent": "Nina P." },
    { "id": 64, "name": "Fiona Apple 64", "address": "64 Maple Close, Otley", "status": "unavailable", "phone": "07700 900164", "email": "fiona.apple64@mail.co.uk", "property": "3-bed semi", "price": "£242,000", "calls": 5, "agent": "Sarah K." },
    { "id": 65, "name": "George Clooney 65", "address": "65 High Street, Skipton", "status": "pending", "phone": "07700 900165", "email": "george.clooney65@mail.co.uk", "property": "2-bed terrace", "price": "£339,000", "calls": 4, "agent": "Sarah K." },
    { "id": 66, "name": "Hannah Montana 66", "address": "66 Beech Ave, Wakefield", "status": "unavailable", "phone": "07700 900166", "email": "hannah.montana66@mail.co.uk", "property": "2-bed terrace", "price": "£555,000", "calls": 5, "agent": "Sarah K." },
    { "id": 67, "name": "Ian McKellen 67", "address": "67 Oak Terrace, Wetherby", "status": "pending", "phone": "07700 900167", "email": "ian.mckellen67@mail.co.uk", "property": "4-bed detached", "price": "£620,000", "calls": 2, "agent": "Nina P." },
    { "id": 68, "name": "Julia Roberts 68", "address": "68 Rose Lane, Castleford", "status": "available", "phone": "07700 900168", "email": "julia.roberts68@mail.co.uk", "property": "3-bed semi", "price": "£637,000", "calls": 0, "agent": "Sarah K." },
    { "id": 69, "name": "Kevin Hart 69", "address": "69 Cherry Way, York", "status": "available", "phone": "07700 900169", "email": "kevin.hart69@mail.co.uk", "property": "4-bed detached", "price": "£228,000", "calls": 4, "agent": "James T." },
    { "id": 70, "name": "Laura Dern 70", "address": "70 Birch Rd, Sheffield", "status": "pending", "phone": "07700 900170", "email": "laura.dern70@mail.co.uk", "property": "3-bed semi", "price": "£519,000", "calls": 3, "agent": "James T." },
    { "id": 71, "name": "Morgan Freeman 71", "address": "71 Pine St, Manchester", "status": "pending", "phone": "07700 900171", "email": "morgan.freeman71@mail.co.uk", "property": "2-bed terrace", "price": "£206,000", "calls": 3, "agent": "James T." },
    { "id": 72, "name": "Natalie Portman 72", "address": "72 Maple Dr, Liverpool", "status": "available", "phone": "07700 900172", "email": "natalie.portman72@mail.co.uk", "property": "3-bed semi", "price": "£622,000", "calls": 5, "agent": "James T." },
    { "id": 73, "name": "Oscar Wilde 73", "address": "73 Cedar Ln, London", "status": "pending", "phone": "07700 900173", "email": "oscar.wilde73@mail.co.uk", "property": "5-bed detached", "price": "£186,000", "calls": 5, "agent": "Sarah K." },
    { "id": 74, "name": "Penelope Cruz 74", "address": "74 Willow Way, Oxford", "status": "pending", "phone": "07700 900174", "email": "penelope.cruz74@mail.co.uk", "property": "3-bed semi", "price": "£378,000", "calls": 4, "agent": "James T." },
    { "id": 75, "name": "Quentin Tarantino 75", "address": "75 Poplar Ave, Cambridge", "status": "pending", "phone": "07700 900175", "email": "quentin.tarantino75@mail.co.uk", "property": "3-bed semi", "price": "£243,000", "calls": 3, "agent": "Sarah K." },
    { "id": 76, "name": "Margaret Holloway 76", "address": "76 Elm Grove, Leeds", "status": "available", "phone": "07700 900176", "email": "margaret.holloway76@mail.co.uk", "property": "3-bed semi", "price": "£519,000", "calls": 0, "agent": "Nina P." },
    { "id": 77, "name": "Priya Sharma 77", "address": "77 Park Lane, Harrogate", "status": "pending", "phone": "07700 900177", "email": "priya.sharma77@mail.co.uk", "property": "4-bed detached", "price": "£206,000", "calls": 3, "agent": "Nina P." },
    { "id": 78, "name": "David Whitfield 78", "address": "78 Victoria Rd, Bradford", "status": "available", "phone": "07700 900178", "email": "david.whitfield78@mail.co.uk", "property": "2-bed terrace", "price": "£622,000", "calls": 2, "agent": "Sarah K." },
    { "id": 79, "name": "Susan Bancroft 79", "address": "79 Maple Close, Otley", "status": "pending", "phone": "07700 900179", "email": "susan.bancroft79@mail.co.uk", "property": "2-bed terrace", "price": "£186,000", "calls": 4, "agent": "Nina P." },
    { "id": 80, "name": "James Patel 80", "address": "80 High Street, Skipton", "status": "pending", "phone": "07700 900180", "email": "james.patel80@mail.co.uk", "property": "5-bed detached", "price": "£378,000", "calls": 4, "agent": "Sarah K." },
    { "id": 81, "name": "Claire Donaldson 81", "address": "81 Beech Ave, Wakefield", "status": "available", "phone": "07700 900181", "email": "claire.donaldson81@mail.co.uk", "property": "2-bed terrace", "price": "£243,000", "calls": 3, "agent": "Nina P." },
    { "id": 82, "name": "Tom Greenwood 82", "address": "82 Oak Terrace, Wetherby", "status": "pending", "phone": "07700 900182", "email": "tom.greenwood82@mail.co.uk", "property": "3-bed semi", "price": "£512,000", "calls": 3, "agent": "Sarah K." },
    { "id": 83, "name": "Alice Cooper 83", "address": "83 Rose Lane, Castleford", "status": "pending", "phone": "07700 900183", "email": "alice.cooper83@mail.co.uk", "property": "4-bed detached", "price": "£161,000", "calls": 3, "agent": "Sarah K." },
    { "id": 84, "name": "Bob Dylan 84", "address": "84 Cherry Way, York", "status": "available", "phone": "07700 900184", "email": "bob.dylan84@mail.co.uk", "property": "4-bed detached", "price": "£239,000", "calls": 2, "agent": "James T." },
    { "id": 85, "name": "Charlie Sheen 85", "address": "85 Birch Rd, Sheffield", "status": "unavailable", "phone": "07700 900185", "email": "charlie.sheen85@mail.co.uk", "property": "3-bed semi", "price": "£302,000", "calls": 4, "agent": "James T." },
    { "id": 86, "name": "Diana Prince 86", "address": "86 Pine St, Manchester", "status": "available", "phone": "07700 900186", "email": "diana.prince86@mail.co.uk", "property": "3-bed semi", "price": "£431,000", "calls": 4, "agent": "James T." },
    { "id": 87, "name": "Edward Norton 87", "address": "87 Maple Dr, Liverpool", "status": "available", "phone": "07700 900187", "email": "edward.norton87@mail.co.uk", "property": "2-bed terrace", "price": "£612,000", "calls": 5, "agent": "Nina P." },
    { "id": 88, "name": "Fiona Apple 88", "address": "88 Cedar Ln, London", "status": "unavailable", "phone": "07700 900188", "email": "fiona.apple88@mail.co.uk", "property": "3-bed semi", "price": "£621,000", "calls": 5, "agent": "Sarah K." },
    { "id": 89, "name": "George Clooney 89", "address": "89 Willow Way, Oxford", "status": "pending", "phone": "07700 900189", "email": "george.clooney89@mail.co.uk", "property": "3-bed semi", "price": "£556,000", "calls": 4, "agent": "Sarah K." },
    { "id": 90, "name": "Hannah Montana 90", "address": "90 Poplar Ave, Cambridge", "status": "unavailable", "phone": "07700 900190", "email": "hannah.montana90@mail.co.uk", "property": "2-bed terrace", "price": "£247,000", "calls": 5, "agent": "Sarah K." },
    { "id": 91, "name": "Ian McKellen 91", "address": "91 Elm Grove, Leeds", "status": "pending", "phone": "07700 900191", "email": "ian.mckellen91@mail.co.uk", "property": "4-bed detached", "price": "£641,000", "calls": 2, "agent": "Nina P." },
    { "id": 92, "name": "Julia Roberts 92", "address": "92 Park Lane, Harrogate", "status": "available", "phone": "07700 900192", "email": "julia.roberts92@mail.co.uk", "property": "3-bed semi", "price": "£172,000", "calls": 0, "agent": "Sarah K." },
    { "id": 93, "name": "Kevin Hart 93", "address": "93 Victoria Rd, Bradford", "status": "available", "phone": "07700 900193", "email": "kevin.hart93@mail.co.uk", "property": "2-bed terrace", "price": "£338,000", "calls": 4, "agent": "James T." },
    { "id": 94, "name": "Laura Dern 94", "address": "94 Maple Close, Otley", "status": "pending", "phone": "07700 900194", "email": "laura.dern94@mail.co.uk", "property": "4-bed detached", "price": "£155,000", "calls": 3, "agent": "James T." },
    { "id": 95, "name": "Morgan Freeman 95", "address": "95 High Street, Skipton", "status": "pending", "phone": "07700 900195", "email": "morgan.freeman95@mail.co.uk", "property": "3-bed semi", "price": "£242,000", "calls": 3, "agent": "James T." },
    { "id": 96, "name": "Natalie Portman 96", "address": "96 Beech Ave, Wakefield", "status": "available", "phone": "07700 900196", "email": "natalie.portman96@mail.co.uk", "property": "3-bed semi", "price": "£339,000", "calls": 5, "agent": "James T." },
    { "id": 97, "name": "Oscar Wilde 97", "address": "97 Oak Terrace, Wetherby", "status": "pending", "phone": "07700 900197", "email": "oscar.wilde97@mail.co.uk", "property": "2-bed terrace", "price": "£555,000", "calls": 5, "agent": "Sarah K." },
    { "id": 98, "name": "Penelope Cruz 98", "address": "98 Rose Lane, Castleford", "status": "pending", "phone": "07700 900198", "email": "penelope.cruz98@mail.co.uk", "property": "2-bed terrace", "price": "£620,000", "calls": 4, "agent": "James T." },
    { "id": 99, "name": "Quentin Tarantino 99", "address": "99 Cherry Way, York", "status": "pending", "phone": "07700 900199", "email": "quentin.tarantino99@mail.co.uk", "property": "2-bed terrace", "price": "£637,000", "calls": 3, "agent": "Sarah K." },
    { "id": 100, "name": "Margaret Holloway 100", "address": "100 Birch Rd, Sheffield", "status": "available", "phone": "07700 900200", "email": "margaret.holloway100@mail.co.uk", "property": "3-bed semi", "price": "£228,000", "calls": 0, "agent": "Nina P." }
];
const VA_SLOTS = {
    1:[{d:3,s:'available',t:'10:00 AM'},{d:7,s:'available',t:'2:00 PM'},{d:10,s:'tentative',t:'11:00 AM'},{d:14,s:'booked',t:'3:30 PM'},{d:17,s:'available',t:'9:00 AM'},{d:22,s:'available',t:'1:00 PM'},{d:25,s:'tentative',t:'4:00 PM'}],
    2:[{d:1,s:'tentative',t:'10:30 AM'},{d:5,s:'booked',t:'2:00 PM'},{d:9,s:'available',t:'11:00 AM'},{d:15,s:'available',t:'3:00 PM'},{d:20,s:'booked',t:'9:30 AM'},{d:24,s:'tentative',t:'1:30 PM'}],
    3:[{d:2,s:'available',t:'9:00 AM'},{d:4,s:'available',t:'2:30 PM'},{d:8,s:'available',t:'11:00 AM'},{d:11,s:'booked',t:'3:00 PM'},{d:16,s:'tentative',t:'10:00 AM'},{d:19,s:'available',t:'4:00 PM'},{d:23,s:'available',t:'1:00 PM'},{d:28,s:'available',t:'9:30 AM'}],
    4:[{d:6,s:'booked',t:'10:00 AM'},{d:12,s:'booked',t:'2:00 PM'},{d:18,s:'booked',t:'3:30 PM'}],
    5:[{d:1,s:'available',t:'9:00 AM'},{d:3,s:'available',t:'11:30 AM'},{d:7,s:'tentative',t:'2:00 PM'},{d:13,s:'available',t:'10:00 AM'},{d:21,s:'available',t:'3:00 PM'},{d:26,s:'booked',t:'1:00 PM'}],
    6:[{d:2,s:'tentative',t:'9:30 AM'},{d:6,s:'available',t:'2:00 PM'},{d:10,s:'booked',t:'11:00 AM'},{d:14,s:'available',t:'3:30 PM'},{d:18,s:'tentative',t:'10:00 AM'},{d:22,s:'available',t:'1:00 PM'},{d:30,s:'available',t:'4:00 PM'}],
    7:[{d:3,s:'available',t:'9:00 AM'},{d:9,s:'available',t:'2:30 PM'},{d:15,s:'booked',t:'11:00 AM'},{d:20,s:'available',t:'3:00 PM'},{d:27,s:'tentative',t:'10:30 AM'}],
    8:[{d:4,s:'booked',t:'10:00 AM'},{d:11,s:'booked',t:'2:00 PM'},{d:17,s:'booked',t:'3:00 PM'},{d:24,s:'booked',t:'9:30 AM'}],
};
const VA_NEXT_CALLS = { 1:'Thu 27 Mar — 10:00 AM', 2:'Fri 28 Mar — 2:30 PM', 3:'Mon 31 Mar — 11:00 AM', 5:'Tue 1 Apr — 9:00 AM', 6:'Wed 2 Apr — 3:00 PM', 7:'Thu 3 Apr — 1:00 PM' };
const VA_AV_COLS = [
    ['#1565c0','#e3f2fd'],['#2e7d32','#e8f5e9'],['#6a1b9a','#f3e5f5'],
    ['#bf360c','#fbe9e7'],['#00695c','#e0f2f1'],['#4527a0','#ede7f6'],
    ['#0277bd','#e1f5fe'],['#558b2f','#f1f8e9'],
];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const SLOT_HOURS = [8,9,10,11,12,13,14,15,16,17];

function vaBadgeStyle(s) {
    if (s==='Booked')    return 'background:#dcfce7;color:#166534;';
    if (s==='Pending')   return 'background:#fef3c7;color:#92400e;';
    if (s==='Cancelled') return 'background:#fee2e2;color:#991b1b;';
    if (s==='Completed') return 'background:#dbeafe;color:#1e40af;';
    return '';
}
function vaStatusLabel(s) { return s; }

export default class NhsApplicationKanbanV7 extends NavigationMixin(LightningElement) {

    /* ── Nav ── */
    @track activeNav = 'application';
    @track vaView    = 'kanban'; // 'kanban' or 'list'
    @track vaFollowUpOnly = false;
    @track activeVendorForSlots = null;

    /* ── Kanban state ── */
    CARDS_PER_COLUMN = 10;
    @track rawColumns     = [];
    @track visibleCounts  = {}; // { 'To be contacted': 10, '1st Contact': 10, ... }
    @track loadingMore    = {};
    @track assigneeList   = [];
    @track searchTerm     = '';
    @track clientSearch   = ''; // for client-side filtering
    @track showArchived   = false;
    @track isLoading      = true;
    @track hasError       = false;
    @track errorMessage   = '';
    @track draggedId      = null;
    @track dragOverStage  = null;

    /* ── View Mode ── */
    @track viewMode          = 'kanban'; // 'kanban' or 'list'
    @track selectedListStage = 'All';
    @track listPage = 1;
    @track listPageSize = 10;

    /* ── Archived Paging & Date Range ── */
    @track arcDateFrom = '';
    @track arcDateTo = '';
    @track arcCurrentPage = 1;
    @track arcPageSize = 10;

    /* ── Advanced Filters ── */
    @track hbOptions      = [];
    @track hbFilter       = null;
    @track hbSearchTerm   = '';
    @track showHbDropdown = false;
    @track appDateFilter  = null;

    /* ── Vendor Availability state (Split-View) ── */
    @track wkStart          = this.getMonday(new Date());
    @track vaSearch         = '';
    @track vaFilter         = 'All';
    @track activeVendorId   = null;
    @track displayedCount    = 25;
    @track vaVendorSlots    = JSON.parse(JSON.stringify(VA_SLOTS)); 
    @track vaQuickState     = {}; 
    @track vmDrawerOpen     = false;
    @track vmNotes          = '';
    @track vmNotesError     = false;
    @track agentModalOpen   = false;
    @track selectedAgentId  = null;
    @track bookingSlot      = null; // { day, time }

    /* ── Toast ── */
    @track toastVisible = false;
    @track toastMessage = '';
    @track toastType    = 'success';
    @track logoUrl     = '';

    _wiredKanbanResult;
    toastTimer;

    /* ══ Wires ══════════════════════════════════════════════════════════ */
    @wire(getAssigneeList) wiredAssignees({ data }) { if (data) this.assigneeList = data; }
    @wire(getHouseBuilderOptions) wiredHbs({ data }) { if (data) this.hbOptions = data; }

    @wire(getAccountFileUrl, { accountId: '$hbFilter' })
    wiredLogo({ error, data }) {
        if (data) {
            this.logoUrl = data.Logo_URL__c || '';
        } else {
            this.logoUrl = '';
        }
    }

    @wire(getApplicationKanbanData, { 
        searchTerm: '$searchTerm', 
        showArchived: '$effectiveShowArchived',
        housebuilderId: '$hbFilter',
        applicationDateStr: '$appDateFilter',
        startDateStr: null,
        endDateStr: null
    })
    wiredKanbanData(result) {
        this._wiredKanbanResult = result;
        this.isLoading = false;
        const { data, error } = result;
        if (data)       { this.rawColumns = data; this.hasError = false; }
        else if (error) { this.hasError = true; this.errorMessage = error.body?.message || 'Failed to load.'; }
    }

    doRefresh() { this.isLoading = true; refreshApex(this._wiredKanbanResult).then(()=>{this.isLoading=false;}).catch(()=>{this.isLoading=false;}); }

    handlePinClick(e) {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        this.isLoading = true;
        togglePin({ opportunityId: id })
            .then(res => {
                const msg = res === 'PINNED' ? 'Application pinned (Max 3)' : 'Application unpinned';
                this.showToast(msg, 'success');
                this.doRefresh();
            })
            .catch(err => {
                this.showToast(err.body?.message || 'Error pinning application', 'error');
            })
            .finally(() => { this.isLoading = false; });
    }

    /* ══ Nav getters ═════════════════════════════════════════════════════ */
    get stageNav() {
        return TOP_STAGES.map(s => ({ ...s, cls:'sn-tab'+(s.key===this.activeNav?' sn-active':''), dotStyle:`background:${s.colour};` }));
    }
    get isApplication()       { return this.activeNav === 'application'; }
    get isVendorAvailability() { return this.activeNav === 'vendor_availability'; }
    get isArchived()           { return this.activeNav === 'archived'; }
    get isAgentsBooked()       { return this.activeNav === 'agents_booked'; }
    get isFiguresToChase()     { return this.activeNav === 'figures_to_chase'; }
    get isFiguresReturned()    { return this.activeNav === 'figures_returned'; }
    get isValuationsReady()    { return this.activeNav === 'valuations_ready'; }
    get showComingSoon()       { return !this.isApplication && !this.isVendorAvailability && !this.isArchived && !this.isAgentsBooked && !this.isFiguresToChase && !this.isFiguresReturned && !this.isValuationsReady; }
    get activeStageLabel()     { return TOP_STAGES.find(x=>x.key===this.activeNav)?.label || ''; }
    handleNavClick(e)          { this.activeNav = e.currentTarget.dataset.key; }

    /* ── Show Archived logic ── */
    get effectiveShowArchived() { return this.showArchived || this.isArchived; }

    /* ── View Mode Switcher ── */
    get isKanbanView() { return this.viewMode === 'kanban'; }
    get isListView()   { return this.viewMode === 'list'; }
    toggleViewMode(e)  { this.viewMode = e.currentTarget.dataset.mode; }
    get kanbanBtnClass()    { return 'vt-btn' + (this.isKanbanView ? ' on' : ''); }
    get listBtnClass()      { return 'vt-btn' + (this.isListView ? ' on' : ''); }
    get kanbanIconVariant() { return this.isKanbanView ? 'inverse' : ''; }
    get listIconVariant()   { return this.isListView ? 'inverse' : ''; }

    /* ── List View getters ── */
    get listStages() {
        const activeStages = ['To be contacted', '1st Contact', '2nd Contact', '3rd Contact'];
        const allCount = activeStages.reduce((sum, s) => {
            const col = (this.rawColumns || []).find(c => c.stageName === s);
            return sum + (col ? col.cardCount || 0 : 0);
        }, 0);
        const isAllOn = this.selectedListStage === 'All';
        const tabs = [{ label: 'All', value: 'All', count: allCount, cls: 'lv-tab' + (isAllOn ? ' on' : ''), tabStyle: isAllOn ? 'background:#2C5F2E;border-color:#2C5F2E;color:#fff;' : '' }];

        const stages = [...activeStages, 'Sale Cancelled'];
        stages.forEach(s => {
            const col = (this.rawColumns || []).find(c => c.stageName === s);
            const count = col ? col.cardCount || 0 : 0;
            const colour = stageColour(s);
            const isOn = this.selectedListStage === s;
            tabs.push({
                label: s === 'Sale Cancelled' ? 'Application Cancelled' : s,
                value: s,
                count,
                cls: 'lv-tab' + (isOn ? ' on' : ''),
                tabStyle: isOn ? `background:${colour};border-color:${colour};color:#fff;` : `border-color:${colour};color:${colour};`,
                dotStyle: `background:${colour};`
            });
        });
        return tabs;
    }

    get allListCards() {
        const activeStages = ['To be contacted', '1st Contact', '2nd Contact', '3rd Contact'];
        let cards = [];

        if (this.selectedListStage === 'All') {
            activeStages.forEach(s => {
                const col = (this.rawColumns || []).find(c => c.stageName === s);
                if (col && col.cards) cards = cards.concat(col.cards);
            });
        } else {
            const col = (this.rawColumns || []).find(c => c.stageName === this.selectedListStage);
            if (col && col.cards) cards = col.cards;
        }

        const cs = this.clientSearch ? this.clientSearch.toLowerCase() : '';
        if (cs) {
            cards = cards.filter(c =>
                (c.name && c.name.toLowerCase().includes(cs)) ||
                (c.appRefNumber && c.appRefNumber.toLowerCase().includes(cs)) ||
                (c.development && c.development.toLowerCase().includes(cs)) ||
                (c.houseBuilder && c.houseBuilder.toLowerCase().includes(cs)) ||
                (c.plot && c.plot.toLowerCase().includes(cs)) ||
                (c.ownerName && c.ownerName.toLowerCase().includes(cs))
            );
        }
        return cards;
    }

    get listCards() {
        const start = (this.listPage - 1) * this.listPageSize;
        const paged = this.allListCards.slice(start, start + this.listPageSize);

        const showSubStage = this.selectedListStage === 'All';
        let lastStage = '';

        return paged.map(c => {
            const isNewStage = showSubStage && c.stageName !== lastStage;
            lastStage = c.stageName;
            return {
                ...c,
                appRefNumber: c.appRefNumber || '—',
                closeDateFormatted: fmtD(c.closeDate),
                avInitials: ini(c.ownerName),
                avStyle: avSt(c.ownerName),
                pinIcon: c.pinned ? 'utility:pinned' : 'utility:pin',
                pinTitle: c.pinned ? 'Unpin' : 'Pin',
                arcIcon: c.archived ? 'utility:undelete' : 'utility:archive',
                arcLabel: c.archived ? 'Unarchive' : 'Archive',
                listRowClass: 'va-row' + (c.pinned ? ' lv-pinned' : '') + (c.archived ? ' lv-archived' : ''),
                isCancelled: c.stageName === 'Sale Cancelled',
                isNewStage,
                stageLabel: c.stageName,
                stageColour: stageColour(c.stageName),
                stageDividerStyle: `background:${stageColour(c.stageName)};`
            };
        });
    }
    handleListStageClick(e) { this.selectedListStage = e.currentTarget.dataset.stage; this.listPage = 1; }

    // List view paging
    get listTotalCount() { return this.allListCards.length; }
    get listTotalPages() { return Math.ceil(this.listTotalCount / this.listPageSize) || 1; }
    get listPageStart() { return this.listTotalCount > 0 ? ((this.listPage - 1) * this.listPageSize) + 1 : 0; }
    get listPageEnd() { return Math.min(this.listPage * this.listPageSize, this.listTotalCount); }
    get listIsPrevDisabled() { return this.listPage <= 1; }
    get listIsNextDisabled() { return this.listPage >= this.listTotalPages; }
    get listShowPaging() { return this.listTotalCount > this.listPageSize; }
    handleListPageSize(e) { this.listPageSize = parseInt(e.target.value, 10); this.listPage = 1; }
    handleListPrevPage() { if (this.listPage > 1) this.listPage--; }
    handleListNextPage() { if (this.listPage < this.listTotalPages) this.listPage++; }

    /* ── Archived View getters ── */
    get archivedCards() {
        const cs = this.clientSearch ? this.clientSearch.toLowerCase() : '';
        const from = this.arcDateFrom || '';
        const to = this.arcDateTo || '';
        const all = [];
        (this.rawColumns || []).forEach(col => {
            (col.cards || []).forEach(c => {
                if (!c.archived) return;
                // Text search
                if (cs && !(
                    (c.name && c.name.toLowerCase().includes(cs)) ||
                    (c.houseBuilder && c.houseBuilder.toLowerCase().includes(cs)) ||
                    (c.development && c.development.toLowerCase().includes(cs)) ||
                    (c.vendorName && c.vendorName.toLowerCase().includes(cs)) ||
                    (c.ownerName && c.ownerName.toLowerCase().includes(cs))
                )) return;
                // Date range filter on closeDate
                if (from && c.closeDate && c.closeDate < from) return;
                if (to && c.closeDate && c.closeDate > to) return;

                all.push({
                    ...c,
                    stageName: col.stageName,
                    closeDateFormatted: fmtD(c.closeDate),
                    avInitials: ini(c.ownerName),
                    avStyle: avSt(c.ownerName),
                    vendorName: c.vendorName || ''
                });
            });
        });
        return all;
    }

    get arcTotalCount() {
        let count = 0;
        (this.rawColumns || []).forEach(col => { (col.cards || []).forEach(c => { if (c.archived) count++; }); });
        return count;
    }
    get arcFilteredCount() { return this.archivedCards.length; }
    get arcTotalPages() { return Math.ceil(this.arcFilteredCount / this.arcPageSize) || 1; }
    get arcPageStart() { return this.arcFilteredCount > 0 ? ((this.arcCurrentPage - 1) * this.arcPageSize) + 1 : 0; }
    get arcPageEnd() { return Math.min(this.arcCurrentPage * this.arcPageSize, this.arcFilteredCount); }
    get arcIsPrevDisabled() { return this.arcCurrentPage <= 1; }
    get arcIsNextDisabled() { return this.arcCurrentPage >= this.arcTotalPages; }
    get arcPagedCards() {
        const start = (this.arcCurrentPage - 1) * this.arcPageSize;
        return this.archivedCards.slice(start, start + this.arcPageSize);
    }

    handleArcDateFrom(e) { this.arcDateFrom = e.target.value; this.arcCurrentPage = 1; }
    handleArcDateTo(e) { this.arcDateTo = e.target.value; this.arcCurrentPage = 1; }
    handleArcPageSize(e) { this.arcPageSize = parseInt(e.target.value, 10); this.arcCurrentPage = 1; }
    handleArcPrevPage() { if (this.arcCurrentPage > 1) this.arcCurrentPage--; }
    handleArcNextPage() { if (this.arcCurrentPage < this.arcTotalPages) this.arcCurrentPage++; }

    /* ══ Kanban getters ══════════════════════════════════════════════════ */
    /* flowPills removed */
    get showBoard()      { return !this.isLoading && !this.hasError; }
    get totalContacts()  { return (this.rawColumns || []).filter(c=>['To be contacted','1st Contact','2nd Contact','3rd Contact'].includes(c.stageName)).reduce((s,c)=>s+(c.cardCount||0),0); }
    get cancelledCards() { const c=(this.rawColumns || []).find(x=>x.stageName==='Sale Cancelled'); return c?c.cardCount:0; }
    get columns() {
        const cs = this.clientSearch ? this.clientSearch.toLowerCase() : '';
        return this.rawColumns.map(col => {
            const colour = stageColour(col.stageName);
            const isOver = this.dragOverStage === col.stageName;
            const isCan  = col.stageName === 'Sale Cancelled';
            const displayStageName = isCan ? 'Application Cancelled' : col.stageName;
            const visibleLimit = this.visibleCounts[col.stageName] || this.CARDS_PER_COLUMN;
            let index = 0;

            // Client-side filter
            let allCards = col.cards || [];
            if (cs) {
                allCards = allCards.filter(c =>
                    (c.name && c.name.toLowerCase().includes(cs)) ||
                    (c.appRefNumber && c.appRefNumber.toLowerCase().includes(cs)) ||
                    (c.development && c.development.toLowerCase().includes(cs)) ||
                    (c.houseBuilder && c.houseBuilder.toLowerCase().includes(cs)) ||
                    (c.plot && c.plot.toLowerCase().includes(cs)) ||
                    (c.ownerName && c.ownerName.toLowerCase().includes(cs))
                );
            }

            const totalCards = allCards.length;
            const visibleCards = allCards.slice(0, visibleLimit);
            const hasMore = totalCards > visibleLimit;
            const moreCount = totalCards - visibleLimit;
            const isLoadingMore = !!this.loadingMore[col.stageName];

            const cards = visibleCards.map(c => {
                const pinIcon = c.pinned ? 'utility:pinned' : 'utility:pin';
                const pinTitle = c.pinned ? 'Unpin application' : 'Pin application';
                const pinBtnClass = c.pinned ? 'pin-btn is-pinned' : 'pin-btn';
                let cardClass = 'kcard';
                if (c.archived) cardClass += ' card-arc';
                if (this.draggedId === c.id) cardClass += ' card-drag';
                if (c.pinned) cardClass += ' pinned-card';

                return {
                    ...c,
                    index: index++,
                    appRefNumber:c.appRefNumber||'—',
                    closeDateFormatted:fmtD(c.closeDate),
                    avInitials:ini(c.ownerName),
                    avStyle:avSt(c.ownerName),
                    arcIcon:c.archived?'utility:undelete':'utility:archive',
                    arcLabel:c.archived?'Unarchive':'Archive',
                    pinIcon,
                    pinTitle,
                    pinBtnClass,
                    cardClass
                };
            });
            return { stageName:displayStageName, internalStageName:col.stageName, cardCount:col.cardCount||0, totalFormatted:fmt(col.totalAmount), showTotal:col.totalAmount>0, isEmpty:cards.length===0, isDragOver:isOver, colClass:'kcol'+(isCan?' col-can':'')+(isOver?' col-ov':''), accentStyle:`border-top:3px solid ${colour};`, accentBarStyle:`background:${colour};`, dotStyle:`background:${colour};`, cards, hasMore, moreCount, isLoadingMore };
        });
    }

    handleLoadMore(e) {
        const stage = e.currentTarget.dataset.stage;
        const col = this.rawColumns.find(c => c.stageName === stage);
        if (!col) return;

        const currentVisible = this.visibleCounts[stage] || this.CARDS_PER_COLUMN;
        const currentTotal = (col.cards || []).length;

        // If we have more cards in memory, just show more
        if (currentTotal > currentVisible) {
            this.visibleCounts = { ...this.visibleCounts, [stage]: currentVisible + this.CARDS_PER_COLUMN };
            return;
        }

        // Otherwise fetch more from server
        this.loadingMore = { ...this.loadingMore, [stage]: true };
        loadMoreCards({
            stageName: stage,
            offsetCount: currentTotal,
            searchTerm: this.searchTerm,
            assigneeFilter: null,
            showArchived: this.effectiveShowArchived,
            housebuilderId: this.hbFilter
        })
        .then(result => {
            if (result && result.length > 0) {
                this.rawColumns = this.rawColumns.map(c => {
                    if (c.stageName === stage) {
                        return {
                            ...c,
                            cards: [...(c.cards || []), ...result],
                            cardCount: (c.cardCount || 0) + result.length
                        };
                    }
                    return c;
                });
                this.visibleCounts = { ...this.visibleCounts, [stage]: currentVisible + this.CARDS_PER_COLUMN };
            }
        })
        .catch(err => {
            this.showToast(err.body?.message || 'Failed to load more', 'error');
        })
        .finally(() => {
            this.loadingMore = { ...this.loadingMore, [stage]: false };
        });
    }

    /* ── Housebuilder Lookup ── */
    get filteredHbOptions() {
        if (!this.hbSearchTerm) return this.hbOptions;
        const s = this.hbSearchTerm.toLowerCase();
        return (this.hbOptions || []).filter(o => o.label.toLowerCase().includes(s));
    }
    get hasHbResults() { return this.filteredHbOptions.length > 0; }
    get hbLookupClass() { return 'hb-lookup' + (this.showHbDropdown ? ' is-open' : ''); }

    handleHbSearch(e) {
        this.hbSearchTerm = e.target.value;
        this.showHbDropdown = true;
        if (!this.hbSearchTerm) {
            this.hbFilter = null;
            this.doRefresh();
        }
    }
    handleHbFocus() { this.showHbDropdown = true; }
    handleHbBlur() { setTimeout(() => { this.showHbDropdown = false; }, 200); }
    handleHbSelect(e) {
        const id = e.currentTarget.dataset.id;
        const label = e.currentTarget.dataset.label;
        this.hbFilter = id;
        this.hbSearchTerm = label;
        this.showHbDropdown = false;
        this.doRefresh();
    }
    clearHbFilter() {
        this.hbFilter = null;
        this.hbSearchTerm = '';
        this.doRefresh();
    }

    handleSearch(e) {
        const val = e.target.value;
        this.clientSearch = val;
        // Debounce server search — only trigger when 3+ chars or empty (reset)
        clearTimeout(this._searchTimeout);
        this._searchTimeout = setTimeout(() => {
            this.searchTerm = val.length >= 3 ? val : '';
            this.visibleCounts = {};
        }, 400);
    }
    clearSearch() { this.clientSearch = ''; this.searchTerm = ''; this.visibleCounts = {}; }
    handleAppDate(e)   { 
        this.appDateFilter = e.target.value || null; 
    }

    clearFilters() {
        this.searchTerm = '';
        this.clientSearch = '';
        this.hbFilter = null;
        this.hbSearchTerm = '';
        this.appDateFilter = null;
        this.showArchived = false;
        this.visibleCounts = {};
        this.doRefresh();
    }

    handleRefresh()   { this.doRefresh(); }
    handleCardClick(e) { const id=e.currentTarget.dataset.id; if(id) this[NavigationMixin.Navigate]({type:'standard__recordPage',attributes:{recordId:id,actionName:'view'}}); }
    handleArchiveClick(e) {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        const arc = e.currentTarget.dataset.archived === 'true';
        archiveOpportunity({ opportunityId: id, archived: !arc })
            .then(() => {
                if (arc) {
                    // Unarchiving — reset stage to "To be contacted" and NHS Process to "Application"
                    return updateRecord({ fields: { Id: id, StageName: 'To be contacted', NHS_Process__c: 'Application' } });
                }
            })
            .then(() => {
                this.showToast(arc ? 'Unarchived — moved to To be contacted' : 'Archived');
                this.doRefresh();
            })
            .catch(err => this.showToast(err.body?.message || 'Error', 'error'));
    }

    handleMoveToVendorAvail(e) {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        this.isLoading = true;
        updateRecord({ fields: { Id: id, NHS_Process__c: 'Vendor Availability' } })
            .then(() => {
                this.showToast('Application moved to Vendor Availability');
                this.doRefresh();
            })
            .catch(err => {
                this.showToast(err.body?.message || 'Failed to move application', 'error');
            })
            .finally(() => { this.isLoading = false; });
    }
    handleDragStart(e) { this.draggedId=e.currentTarget.dataset.id; e.dataTransfer.setData('text/plain',this.draggedId); }
    handleDragEnd()    { this.draggedId=null; this.dragOverStage=null; }
    handleDragEnter(e) { e.preventDefault(); this.dragOverStage=e.currentTarget.dataset.stage; }
    handleDragOver(e)  { 
        e.preventDefault(); 
        e.dataTransfer.dropEffect='move'; 
    }
    handleDragLeave(e) { if(!e.currentTarget.contains(e.relatedTarget)) this.dragOverStage=null; }

    handleDrop(e) {
        e.preventDefault();
        const targetStage = e.currentTarget.dataset.stage;
        const cardId = e.dataTransfer.getData('text/plain')||this.draggedId;
        this.draggedId=null; this.dragOverStage=null;
        
        if(!cardId||!targetStage) return;

        // Calc drop position (optional: if dropped on a card, we use its index)
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        // In a simple Kanban, we might just append to the end if dropped on the column.
        // But for intra-reorder, we should find the sibling cards.
        
        let sourceStage=null, movedCard=null;
        for(const col of this.rawColumns){ 
            const found=(col.cards||[]).find(c=>c.id===cardId); 
            if(found){sourceStage=col.stageName; movedCard=found; break;} 
        }
        if(!sourceStage) return;

        // Determine new card list for target stage
        let targetCol = this.rawColumns.find(col => col.stageName === targetStage);
        if (!targetCol) return;

        let newCards = [...(targetCol.cards || [])].filter(c => c.id !== cardId);
        
        // Find drop index based on card elements
        const cardEls = [...e.currentTarget.querySelectorAll('.kcard')];
        let dropIdx = newCards.length;
        for (let i = 0; i < cardEls.length; i++) {
            const el = cardEls[i];
            if (el.dataset.id === cardId) continue;
            const b = el.getBoundingClientRect();
            if (e.clientY < b.top + b.height/2) {
                dropIdx = i;
                break;
            }
        }
        newCards.splice(dropIdx, 0, { ...movedCard, stageName: targetStage });

        // Update local state immediately
        this.rawColumns = this.rawColumns.map(col => {
            if (col.stageName === sourceStage && sourceStage !== targetStage) {
                const cards = (col.cards||[]).filter(c => c.id !== cardId);
                return { ...col, cards, cardCount: cards.length };
            }
            if (col.stageName === targetStage) {
                return { ...col, cards: newCards, cardCount: newCards.length };
            }
            return col;
        });

        const promises = [];
        if (sourceStage !== targetStage) {
            promises.push(updateOpportunityStage({ opportunityId: cardId, newStageName: targetStage }));
        }
        
        // Update sort order for all cards in the target column
        const orderedIds = newCards.map(c => c.id);
        promises.push(updateCardOrder({ opportunityIds: orderedIds }));

        Promise.all(promises)
            .then(() => {
                this.showToast(sourceStage === targetStage ? 'Order updated' : `Moved to "${targetStage}"`);
                this.doRefresh();
            })
            .catch(err => {
                this.showToast(err.body?.message || 'Update failed', 'error');
                this.doRefresh();
            });
    }

    /* ── Vendor Availability Split-View Logic ── */
    getMonday(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    }

    get vaVendors() {
        const q = (this.vaSearch || '').toLowerCase();
        const filtered = VA_VENDORS
            .filter(v => (this.vaFilter === 'All' || v.status.toLowerCase() === this.vaFilter.toLowerCase()) && 
                         (!q || v.name.toLowerCase().includes(q) || v.address.toLowerCase().includes(q)))
            .map(v => {
                const isActive = this.activeVendorId === v.id;
                return { 
                    ...v, 
                    itemCls: `vlist-card ${isActive ? 'active' : ''}`,
                    pillCls: `vi-pill ${v.status.toLowerCase()}`,
                    hasVM: v.calls > 2,
                    vmCount: v.calls > 2 ? v.calls - 2 : 0
                };
            });
        return filtered.slice(0, this.displayedCount);
    }

    get vaWeekDays() {
        const days = [];
        const today = new Date();
        today.setHours(0,0,0,0);
        const todayStr = today.toDateString();
        for (let i = 0; i < 5; i++) {
            const d = new Date(this.wkStart);
            d.setDate(d.getDate() + i);
            const isPast = d < today;
            days.push({
                name: WEEK_DAYS[i],
                date: d.getDate(),
                fullDate: d.toDateString(),
                isPast: isPast,
                isToday: d.toDateString() === todayStr,
                dayCls: `ch-day ${d.toDateString() === todayStr ? 'today' : ''} ${isPast ? 'past' : ''}`,
                dateCls: `ch-ddate ${d.toDateString() === todayStr ? 'tod' : ''}`
            });
        }
        return days;
    }

    get vaWkLabel() {
        const start = this.wkStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const end = new Date(this.wkStart);
        end.setDate(end.getDate() + 4);
        const endStr = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${start} — ${endStr}`;
    }

    get activeVendor() {
        if (!this.activeVendorId) return null;
        return VA_VENDORS.find(v => v.id === this.activeVendorId);
    }

    get vaSlots() {
        if (!this.activeVendorId) return [];
        const vendorData = this.vaVendorSlots[this.activeVendorId] || [];
        const grid = [];
        const today = new Date();
        today.setHours(0,0,0,0);
        
        SLOT_HOURS.forEach(hour => {
            const timeLabel = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
            const rowDays = [];
            for (let i = 0; i < 5; i++) {
                const d = new Date(this.wkStart);
                d.setDate(d.getDate() + i);
                const dayNum = d.getDate();
                const isPast = d < today;
                
                const slot = vendorData.find(s => s.d === dayNum && s.t === timeLabel);
                const status = slot ? slot.s : 'none';
                
                let slotCls = `cal-slot ${status}`;
                if (isPast && status !== 'booked') slotCls += ' past';

                rowDays.push({
                    day: dayNum,
                    time: timeLabel,
                    isPast: isPast, // ADDED
                    cellKey: `${dayNum}_${timeLabel}`,
                    status: status,
                    isBooked: status === 'booked',
                    agent: slot?.agent || 'No Agent',
                    slotCls: slotCls
                });
            }
            grid.push({ time: timeLabel, days: rowDays });
        });
        return grid;
    }

    get vaVoicemails() {
        return VA_VENDORS.filter(v => v.calls > 2).map(v => ({
            ...v,
            noNote: v.calls === 3 // Mock logic: if exactly 3 calls, needs a note
        }));
    }

    get vaVmCount() {
        return this.vaVoicemails.length;
    }

    // Handlers
    handleVaSearch(e) { this.vaSearch = e.target.value; }
    handleVaFilter(e) { this.vaFilter = e.currentTarget.dataset.filter; }
    handleVendorSelect(e) { this.activeVendorId = parseInt(e.currentTarget.dataset.id, 10); }

    handleVlistScroll(e) {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            if (this.displayedCount < VA_VENDORS.length) {
                this.displayedCount += 25;
            }
        }
    }
    
    handleWkShift(e) {
        const dir = parseInt(e.currentTarget.dataset.dir, 10);
        const next = new Date(this.wkStart);
        next.setDate(next.getDate() + (dir * 7));
        this.wkStart = next;
    }

    handleWkToday() {
        this.wkStart = this.getMonday(new Date());
    }

    handleSlotClick(e) {
        const { day, time, past } = e.currentTarget.dataset;
        if (past === 'true') return; // BLOCK PAST DATES
        const dayNum = parseInt(day, 10);
        if (!this.activeVendorId) return;

        if (!this.vaVendorSlots[this.activeVendorId]) this.vaVendorSlots[this.activeVendorId] = [];
        const slots = this.vaVendorSlots[this.activeVendorId];
        const idx = slots.findIndex(s => s.d === dayNum && s.t === time);

        if (idx > -1) {
            if (slots[idx].s === 'booked') return;
            slots.splice(idx, 1);
        } else {
            slots.push({ d: dayNum, t: time, s: 'available' });
        }
        this.vaVendorSlots = { ...this.vaVendorSlots };
    }

    handleQuickClick(e) {
        const { day, type, past } = e.currentTarget.dataset;
        if (past === 'true') return; // BLOCK PAST DATES
        const dayNum = parseInt(day, 10);
        if (!this.activeVendorId) return;

        const stateKey = `${dayNum}_${type}`;
        const isCurrentlyOn = this.vaQuickState[stateKey];
        if (!this.vaVendorSlots[this.activeVendorId]) this.vaVendorSlots[this.activeVendorId] = [];
        const slots = this.vaVendorSlots[this.activeVendorId];

        const targetHours = type === 'AM' ? [8,9,10,11] : (type === 'PM' ? [12,13,14,15,16,17] : SLOT_HOURS);
        const targetTimes = targetHours.map(h => `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`);

        if (isCurrentlyOn) {
            targetTimes.forEach(time => {
                const idx = slots.findIndex(s => s.d === dayNum && s.t === time && s.s !== 'booked');
                if (idx > -1) slots.splice(idx, 1);
            });
            delete this.vaQuickState[stateKey];
        } else {
            targetTimes.forEach(time => {
                const exists = slots.find(s => s.d === dayNum && s.t === time);
                if (!exists) slots.push({ d: dayNum, t: time, s: 'available' });
            });
            this.vaQuickState[stateKey] = true;
        }
        this.vaVendorSlots = { ...this.vaVendorSlots };
        this.vaQuickState = { ...this.vaQuickState };
    }

    handleVmToggle() {
        this.vmDrawerOpen = !this.vmDrawerOpen;
    }

    handleVmNoteChange(e) {
        this.vmNotes = e.target.value;
        if (this.vmNotes.trim()) this.vmNotesError = false;
    }

    handleLVM() {
        if (!this.vmNotes.trim()) {
            this.vmNotesError = true;
            return;
        }
        this.showToast('Voicemail logged successfully', 'success');
        this.vmNotes = '';
        this.vmNotesError = false;
    }

    handleOpenBooking(e) {
        const { day, time } = e.currentTarget.dataset;
        this.bookingSlot = { day, time };
        this.agentModalOpen = true;
    }

    handleCloseBooking() {
        this.agentModalOpen = false;
        this.bookingSlot = null;
        this.selectedAgentId = null;
    }

    get agents() {
        return [
            { id: 1, name: 'James Thompson', area: 'Leeds Central', initials: 'JT', color: '#16a34a' },
            { id: 2, name: 'Sarah Jenkins', area: 'Harrogate & Ripon', initials: 'SJ', color: '#2563eb' },
            { id: 3, name: 'Nina Patel', area: 'Bradford West', initials: 'NP', color: '#d97706' }
        ].map(a => ({
            ...a,
            style: `background: ${a.color}`,
            cls: `agent-card ${this.selectedAgentId === a.id ? 'sel' : ''}`
        }));
    }

    handleAgentSelect(e) {
        this.selectedAgentId = parseInt(e.currentTarget.dataset.id, 10);
    }

    handleConfirmBooking() {
        if (!this.selectedAgentId) {
            this.showToast('Please select an agent', 'error');
            return;
        }
        this.showToast(`Agent booked for ${this.bookingSlot.time}`, 'success');
        this.handleCloseBooking();
    }

    get vmDrawerCls() {
        return `vm-drawer ${this.vmDrawerOpen ? 'open' : ''}`;
    }
    get vmDrawerOverlayCls() {
        return `vm-drawer-overlay ${this.vmDrawerOpen ? 'open' : ''}`;
    }
    get agentModalBgCls() {
        return `modal-bg ${this.agentModalOpen ? 'open' : ''}`;
    }
    get bookingSlotDay() {
        return this.bookingSlot ? this.bookingSlot.day : '';
    }
    get bookingSlotTime() {
        return this.bookingSlot ? this.bookingSlot.time : '';
    }

    get vaFilterAll() { return `va-filter-tab ${this.vaFilter === 'All' ? 'on' : ''}`; }
    get vaFilterBooked() { return `va-filter-tab ${this.vaFilter === 'Booked' ? 'on' : ''}`; }
    get vaFilterPending() { return `va-filter-tab ${this.vaFilter === 'Pending' ? 'on' : ''}`; }
    get vaFilterCancelled() { return `va-filter-tab ${this.vaFilter === 'Cancelled' ? 'on' : ''}`; }

    /* ══ Toast ═══════════════════════════════════════════════════════════ */
    showToast(msg, type='success') {
        clearTimeout(this.toastTimer);
        this.toastMessage=msg; this.toastType=type; this.toastVisible=true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.toastTimer=setTimeout(()=>{this.toastVisible=false;},3000);
    }
    get toastClass() { return 'toast toast-'+this.toastType; }
    get toastIcon()  { return this.toastType==='success'?'utility:success':'utility:error'; }
}