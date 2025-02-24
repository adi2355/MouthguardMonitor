export const BONG_HITS_DATABASE_NAME: string = "BongHits";
export const SAVED_DEVICES_DATABASE_NAME: string = "SavedDevices";
export const STRAINS_DATABASE_NAME: string = "Strains";

export const dayLookUpTable = new Map<number, string>()
dayLookUpTable.set(0, "Sun");
dayLookUpTable.set(1, "Mon");
dayLookUpTable.set(2, "Tue");
dayLookUpTable.set(3, "Wed");
dayLookUpTable.set(4, "Thu");
dayLookUpTable.set(5, "Fri");
dayLookUpTable.set(6, "Sat");

export const COLORS = {
  background: '#000000',
  cardBackground: '#1A1A1A',
  primary: '#00E676',       // Neon green 
  primaryLight: '#69F0AE',  // Light neon green
  primaryDark: '#00C853',   // Darker green
  text: {
    primary: '#FFFFFF',
    secondary: '#FFFFFFCC',  // 80% white
    tertiary: '#FFFFFF99',   // 60% white
  },
  chart: {
    primary: '#00E676',
    secondary: '#69F0AE',
    background: '#1A1A1A',
  },
  gradientColors: {
    start: 'rgba(0,230,118,0.4)',
    middle: 'rgba(105,240,174,0.2)',
    end: 'rgba(0,0,0,0)',
  }
};

/**
 * Stupid goofy hardcoded function for testing
 * https://www.mockaroo.com/
 * @returns 
 */
export function getInsertStatements(): string {
    return(`
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 18:28:33', 27050);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 03:31:57', 12228);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 23:51:43', 13319);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 17:23:17', 18857);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 11:04:59', 10164);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 12:15:16', 17533);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 14:02:16', 6253);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 08:19:24', 16822);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 08:59:23', 22545);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 00:18:00', 8259);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 04:04:13', 2611);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 07:48:33', 22620);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 21:38:17', 15988);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 14:01:32', 22414);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 01:11:03', 15364);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 15:27:55', 4427);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 20:31:00', 4238);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 06:22:38', 15957);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 14:39:58', 26633);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 08:48:03', 13728);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 08:49:51', 15266);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 20:12:41', 28871);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 10:54:11', 21137);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 19:39:11', 15547);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 23:10:19', 26405);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 23:16:18', 26609);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 00:47:56', 14683);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 12:40:53', 8349);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 13:22:24', 2529);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 05:51:30', 27163);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 18:13:22', 2017);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 14:04:39', 16879);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 19:32:07', 21005);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 14:58:39', 11376);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 12:38:21', 10324);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 11:38:52', 12010);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 22:09:03', 25025);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 20:06:15', 23315);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 23:46:27', 5947);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 09:35:11', 28873);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 05:31:18', 9933);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 08:16:19', 11598);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 02:06:41', 5220);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 18:26:53', 29317);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 18:31:28', 9696);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 03:01:15', 1722);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 22:53:09', 11971);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 23:41:27', 1696);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 21:20:11', 1938);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 00:02:10', 8739);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 22:30:33', 23382);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 09:09:16', 3101);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 12:25:42', 13340);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 05:44:07', 19667);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 23:58:50', 14682);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 19:07:30', 24476);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 08:40:40', 14354);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 07:49:21', 1256);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 00:56:24', 10278);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 01:15:44', 7190);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 06:26:27', 27299);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 14:33:52', 15905);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 06:11:55', 19032);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 23:02:27', 18370);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 15:54:03', 11882);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 02:46:22', 7576);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 19:05:26', 25154);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 20:10:40', 12887);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 07:33:01', 6308);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 00:25:59', 25113);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 09:01:27', 8963);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 22:59:58', 18095);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 10:12:03', 22986);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 00:00:28', 4289);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 10:17:33', 24578);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 03:02:28', 27227);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 15:25:26', 12128);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 15:44:36', 13216);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 03:35:02', 21264);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 19:39:28', 16349);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 11:37:03', 1560);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 03:02:07', 9661);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 07:55:44', 14209);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 23:56:43', 15217);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 18:34:17', 21324);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 11:23:57', 8449);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 23:25:34', 10440);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 17:27:45', 16397);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 06:48:50', 17728);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 02:50:59', 28456);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 15:22:11', 2355);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 02:26:45', 22264);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 13:52:29', 11556);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 15:50:53', 15389);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 00:46:53', 20501);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 14:42:23', 23826);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 08:20:24', 23469);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 00:48:39', 4673);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 12:46:37', 6143);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 19:15:14', 17958);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 09:31:58', 12818);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 19:27:55', 17130);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 00:29:24', 26745);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 20:09:06', 6774);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 12:21:58', 20714);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 23:34:50', 25222);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 23:31:36', 8294);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 08:25:24', 22141);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 15:25:19', 15331);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 12:35:28', 23559);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 11:17:03', 18771);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 13:09:37', 19791);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 18:35:08', 16599);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 00:56:47', 2883);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 23:31:56', 28255);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 09:01:04', 5614);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 21:18:19', 8019);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 14:47:23', 9281);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 03:04:53', 14525);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 22:24:55', 4877);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 08:20:46', 21000);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 03:28:26', 18682);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 16:31:38', 12361);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 18:48:14', 17469);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 15:58:50', 8781);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 22:55:12', 9940);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 15:39:19', 27739);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 19:10:57', 6675);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 18:02:28', 9229);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 23:34:43', 21950);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 05:49:14', 17697);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 09:50:53', 3006);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 14:37:41', 12970);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 11:07:08', 14972);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 11:34:03', 28490);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 05:29:49', 3179);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 23:39:20', 3344);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 18:43:45', 11380);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 16:29:56', 25279);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 13:11:15', 2086);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 20:23:14', 13442);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 13:30:30', 9339);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 13:26:47', 4365);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 19:31:06', 15770);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 17:26:04', 8196);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 09:07:00', 18517);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 23:24:35', 8582);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 08:59:00', 25597);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 18:48:47', 18583);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 14:29:09', 3844);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 19:40:33', 4154);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 22:05:57', 20669);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 15:32:01', 22298);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 13:38:55', 14931);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 14:33:46', 19567);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 14:38:00', 6719);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 09:02:46', 20582);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 18:43:08', 1940);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 22:58:56', 13892);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 04:29:41', 5393);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 11:48:46', 20049);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 18:10:55', 10213);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 04:22:49', 5747);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 05:13:01', 1401);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 04:24:00', 13341);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 18:13:48', 8321);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 14:18:48', 20796);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 02:09:42', 29228);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 23:19:13', 1473);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 21:02:12', 1753);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 13:09:18', 29396);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 15:09:11', 5841);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 04:44:01', 25423);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 02:28:48', 19248);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 23:44:06', 20424);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 14:43:24', 21147);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 22:00:51', 17591);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 18:08:44', 11846);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 22:26:38', 1607);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 04:19:19', 19273);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 11:48:01', 23188);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 13:51:19', 21280);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 15:25:48', 3904);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 03:34:27', 4270);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 21:58:58', 14515);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 10:20:38', 16545);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 00:22:13', 8443);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 12:26:12', 1432);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 14:00:45', 20597);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 02:18:06', 27981);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 20:43:28', 1833);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 22:50:56', 12268);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 01:37:54', 26719);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 11:36:50', 1959);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 08:10:44', 5918);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 16:07:11', 23560);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 05:22:31', 2195);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 04:31:30', 9281);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 04:44:11', 11141);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 14:28:49', 20490);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 10:25:12', 21551);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 12:25:46', 21114);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 02:22:33', 22851);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 14:58:55', 28280);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 08:11:17', 22100);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 17:48:13', 26793);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 16:56:21', 13085);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 22:36:34', 1183);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 00:45:27', 7545);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 16:17:44', 9817);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 02:09:12', 19452);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 23:44:59', 1775);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 20:30:57', 24365);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 04:42:10', 20488);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 08:49:35', 11969);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 05:10:43', 4718);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 00:36:52', 6532);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 06:00:07', 2964);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 03:30:11', 2792);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 08:55:12', 29073);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 23:24:27', 12784);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 13:48:03', 18556);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 08:10:53', 4315);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 23:31:21', 4884);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 06:24:57', 20050);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 18:45:20', 24488);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 22:04:00', 7904);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 02:05:28', 2817);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 18:08:42', 22405);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 12:55:07', 15391);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 21:36:35', 4364);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 04:09:30', 14833);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 09:43:30', 14447);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 04:12:23', 6487);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 06:21:34', 1953);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 10:06:41', 23735);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 01:25:39', 26339);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 02:00:56', 16085);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 19:29:57', 26554);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 19:51:31', 6156);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 07:03:40', 9443);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 20:40:50', 16029);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 01:15:51', 16188);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 17:02:52', 1990);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 17:33:31', 8163);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 01:03:50', 13352);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 04:13:22', 29982);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 18:50:23', 28909);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 09:00:19', 11230);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 04:55:05', 29399);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 19:53:25', 28447);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 14:06:16', 14004);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 23:47:36', 28681);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 19:21:46', 22242);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 08:04:26', 10230);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 03:18:10', 29103);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 11:36:18', 15670);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 08:32:36', 25891);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 00:43:47', 25134);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 16:57:37', 21671);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 21:39:58', 23569);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 20:21:11', 11529);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 00:10:44', 22232);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 17:52:51', 2600);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 03:46:13', 6850);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 18:00:29', 12308);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 01:53:48', 22742);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 00:49:37', 23289);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 18:25:19', 18954);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 13:33:15', 24082);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 02:47:45', 19382);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 23:22:49', 21350);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 01:48:44', 14901);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 22:06:59', 22882);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 22:07:46', 25474);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 05:59:40', 11558);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 09:13:10', 16217);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 23:01:04', 24839);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 07:06:53', 27923);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 15:09:48', 6425);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 11:09:20', 6536);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 00:15:36', 5754);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 18:31:58', 16608);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 16:01:33', 2565);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 02:41:41', 24875);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 23:39:15', 27481);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 09:51:30', 29456);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 09:27:11', 2759);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 18:10:17', 23121);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 21:13:22', 26974);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 03:29:48', 19583);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 20:35:37', 19799);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 08:42:12', 25335);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 16:09:59', 21197);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 03:36:19', 29852);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 16:42:10', 29568);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 20:56:25', 4824);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 09:27:20', 29735);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 18:39:02', 3114);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 07:38:42', 19765);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 17:35:06', 8208);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 12:16:44', 10238);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 02:06:24', 5430);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 20:43:56', 15531);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 23:21:02', 3030);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 15:54:22', 10465);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 09:26:16', 3439);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 15:46:30', 9416);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 14:44:41', 4069);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 14:28:25', 25070);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 22:52:05', 5400);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 05:57:30', 18851);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 19:23:51', 11139);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 17:14:17', 5761);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 01:55:03', 3969);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 14:28:55', 13416);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 01:57:22', 4251);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 01:27:34', 15220);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 19:59:45', 12514);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 05:45:41', 10036);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 00:31:07', 29512);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 07:54:00', 1998);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 02:24:24', 25692);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 07:45:34', 16259);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 09:17:48', 9367);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 20:01:39', 19067);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 16:24:27', 8343);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 15:06:09', 22859);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 05:53:55', 24721);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 12:34:16', 12123);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 13:03:04', 15336);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 00:22:58', 26799);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 02:28:39', 23453);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 02:49:20', 8332);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 17:21:24', 12961);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 17:50:55', 14636);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 07:30:24', 20414);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 07:40:23', 29070);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 13:04:53', 22082);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 06:17:53', 6053);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 03:00:21', 18137);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 13:17:20', 9537);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 19:54:05', 27472);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 12:12:35', 1641);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 23:43:48', 14055);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 14:21:33', 20924);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 10:26:06', 14534);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 11:19:47', 18564);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 03:27:35', 23549);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 10:05:28', 17265);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 09:49:25', 22426);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 11:55:27', 2238);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 08:38:23', 23557);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 23:28:36', 12506);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 21:47:23', 11052);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 14:40:05', 5367);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 05:41:55', 18727);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 09:35:32', 11867);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 18:58:29', 23122);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 15:24:16', 24627);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 13:13:43', 24051);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 13:45:36', 18388);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 12:03:13', 18629);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 18:32:25', 14724);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 10:29:18', 13976);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 04:05:04', 27438);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 15:48:00', 7551);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 20:27:44', 18195);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 17:25:14', 13291);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 09:23:12', 4080);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 16:31:06', 10816);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 05:36:54', 18519);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 00:30:13', 5290);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 17:03:29', 3736);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 11:54:00', 21882);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 14:09:50', 26173);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 06:04:10', 29624);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 22:35:39', 17801);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 14:14:09', 4294);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 07:07:20', 9000);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 13:46:15', 6109);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 02:44:27', 27295);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 18:37:04', 3947);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 09:09:51', 7800);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 15:19:26', 4910);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 04:38:44', 10800);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 01:46:35', 22625);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 03:53:15', 12428);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 14:44:15', 2854);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 10:36:49', 11191);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 23:34:52', 9553);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 18:38:08', 8519);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 13:16:06', 5532);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 02:39:06', 9681);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 07:40:17', 14701);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 09:11:40', 29446);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 17:00:04', 29779);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 12:54:01', 28144);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 07:11:16', 24677);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 03:45:49', 7052);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 09:56:25', 13163);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 08:01:07', 2374);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 03:11:07', 21367);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 09:05:18', 25581);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 15:07:47', 7510);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 05:20:33', 12441);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 22:26:18', 1062);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 00:43:29', 16946);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 09:52:43', 21759);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 02:20:03', 18991);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 18:31:48', 27594);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 10:24:42', 7588);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 12:50:29', 9607);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 08:18:18', 10598);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 23:51:47', 2989);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 18:13:31', 7804);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 14:33:14', 29222);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 04:40:20', 23484);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 02:43:15', 21995);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 22:10:28', 10812);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 12:45:47', 23486);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 17:58:03', 15955);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 19:51:28', 15801);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 11:55:21', 10458);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 02:27:07', 15711);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 15:31:46', 7600);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 04:09:40', 6180);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 09:53:24', 29747);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 22:19:09', 3260);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 12:29:56', 19390);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 21:36:59', 7541);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 12:32:19', 13900);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 06:20:04', 19917);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 02:45:34', 29118);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 12:25:10', 12181);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 20:58:05', 5013);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 02:38:02', 8810);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 09:11:32', 7966);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 14:15:14', 18683);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 10:39:37', 13640);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 04:55:37', 23251);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 21:56:35', 5173);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 19:54:28', 7348);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 21:14:49', 18018);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 13:57:07', 3834);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 19:30:36', 6917);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 02:26:11', 5416);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 22:27:56', 11363);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 16:12:37', 12834);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 05:27:14', 3697);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 11:20:02', 28791);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 04:21:20', 20301);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 19:01:55', 28113);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 09:51:03', 4978);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 07:03:23', 12305);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 11:46:43', 4049);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 04:50:47', 11326);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 02:13:00', 6826);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 18:50:17', 2072);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 11:33:45', 19223);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 09:36:03', 25528);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 15:18:32', 29726);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 08:14:11', 3761);
insert into BongHits (timestamp, duration_ms) values ('2025-01-05 04:17:52', 25327);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 10:49:25', 14247);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 04:56:54', 13485);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 12:56:13', 15813);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 02:15:35', 6773);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 16:48:37', 25586);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 05:28:24', 15341);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 15:42:12', 20580);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 16:13:18', 26037);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 00:43:21', 10891);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 00:35:08', 16042);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 03:28:45', 11956);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 01:36:22', 3039);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 05:04:03', 2865);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 16:23:25', 7787);
insert into BongHits (timestamp, duration_ms) values ('2024-12-30 14:05:22', 5178);
insert into BongHits (timestamp, duration_ms) values ('2024-12-27 04:25:42', 21285);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 18:07:21', 18783);
insert into BongHits (timestamp, duration_ms) values ('2024-12-29 17:54:10', 18837);
insert into BongHits (timestamp, duration_ms) values ('2024-12-31 20:49:38', 2061);
insert into BongHits (timestamp, duration_ms) values ('2025-01-02 05:08:46', 13926);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 11:57:02', 8834);
insert into BongHits (timestamp, duration_ms) values ('2024-12-24 02:29:40', 5202);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 05:59:56', 2499);
insert into BongHits (timestamp, duration_ms) values ('2024-12-25 15:51:47', 16481);
insert into BongHits (timestamp, duration_ms) values ('2024-12-26 17:58:32', 15400);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 07:39:18', 28475);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 08:18:54', 23077);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 00:24:12', 16786);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 16:59:17', 5920);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 12:38:06', 5413);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 15:30:39', 27002);
insert into BongHits (timestamp, duration_ms) values ('2025-01-01 04:28:13', 17167);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 07:44:17', 12518);
insert into BongHits (timestamp, duration_ms) values ('2025-01-04 22:13:21', 2641);
insert into BongHits (timestamp, duration_ms) values ('2025-01-03 15:20:32', 25185);
insert into BongHits (timestamp, duration_ms) values ('2024-12-28 15:13:36', 10003);
`)
}

export function getStrainsCSV(): string {
  return `"Strain Name","Overview","Genetic Type","Lineage","THC Range","CBD Level","Dominant Terpenes","Qualitative Insights","Effects","Negatives","Uses","THC-Based Potency Rating (1-10)","User Rating (1-10)","Combined Potency / User Rating (1-10)"
"Trainwreck","Sativa-dominant hybrid known for its explosive cerebral high and rapid onset.","Sativa-dominant Hybrid","Mexican, Thai, Afghani","18-22%","Minimal","Myrcene, Pinene","Spicy, citrus aroma with a hint of pine; dense, energetic buds","Energized, Creative, Uplifted","dry mouth, dry eyes, dizziness","Ideal for creative pursuits, social settings, combating fatigue","7.5","7","7.25"
"Blue Dream","Balanced sativa-dominant hybrid offering gentle cerebral invigoration and full-body relaxation.","Sativa-dominant Hybrid","Blueberry x Haze","17-24%","Low","Myrcene, Pinene, Caryophyllene","Sweet berry aroma with earthy undertones; smooth buds","Euphoric, Relaxed, Creative","dry mouth, dry eyes","Great for stress relief, daytime use, creative tasks","7.75","7.5","7.63"
"Girl Scout Cookies","Popular hybrid known for its euphoric and relaxing effects with a sweet, earthy aroma.","Indica-dominant Hybrid","OG Kush x Durban Poison","18-28%","Low","Caryophyllene, Limonene","Sweet, earthy scent with hints of mint; dense, resinous buds","Happy, Relaxed, Euphoric","dry mouth, drowsiness","Effective for pain relief and mood elevation","9","8.5","8.75"
"Sour Diesel","Energetic sativa-dominant strain with a pungent diesel aroma.","Sativa-dominant","Chemdawg x Super Skunk","20-25%","Low","Limonene, Caryophyllene","Pungent, fuel-like scent with citrus hints; airy buds","Energetic, Uplifted, Focused","dry mouth, anxiety","Ideal for daytime use and creative projects","8.75","8","8.38"
"OG Kush","Iconic hybrid delivering a balanced high with earthy pine and citrus flavors.","Hybrid","Chemdawg x Hindu Kush","19-26%","Low","Myrcene, Limonene","Earthy, pine aroma with a touch of citrus; dense, resinous buds","Relaxed, Euphoric, Uplifted","dry mouth, dry eyes","Used for stress relief and pain management","8.75","8","8.38"
"Pineapple Express","Tropical sativa-dominant hybrid offering a sweet, fruity flavor and energetic high.","Sativa-dominant Hybrid","Trainwreck x Hawaiian","19-25%","Low","Limonene, Myrcene","Tropical pineapple aroma with hints of earthiness; vibrant buds","Energetic, Uplifted, Creative","dry mouth, dry eyes","Perfect for social settings and daytime activities","8.5","8","8.25"
"Granddaddy Purple","Renowned indica-dominant strain with a deep purple hue and grape-like aroma.","Indica-dominant","Purple Urkle x Big Bud","17-23%","Low","Myrcene, Pinene","Sweet, grape aroma with a relaxing, heavy bud structure","Relaxed, Sleepy, Euphoric","dry mouth, drowsiness","Ideal for pain relief and insomnia","7.5","7","7.25"
"White Widow","Balanced hybrid known for its potent resin production and earthy pine flavor.","Hybrid","Brazilian Sativa x South Indian Indica","18-25%","Low","Myrcene, Caryophyllene","Earthy, woody aroma with a subtle sweet note; frosty buds","Energetic, Euphoric, Creative","dry mouth, dry eyes","Suitable for stress relief and social use","8.25","8","8.13"
"AK-47","Sativa-dominant hybrid offering a mellow, long-lasting cerebral high with a sweet, sour flavor.","Sativa-dominant Hybrid","Colombian, Mexican, Thai, Afghani","13-20%","Low","Myrcene, Limonene","Sweet and sour aroma with a light, airy bud structure","Relaxed, Uplifted, Creative","dry mouth, fatigue","Great for relaxation and creative inspiration","5.75","6","5.88"
"Durban Poison","Pure sativa known for its energizing effects and sweet, earthy aroma.","Pure Sativa","South African Landrace","15-25%","Low","Terpinolene, Myrcene","Sweet, earthy scent with hints of pine; light, fluffy buds","Energizing, Uplifting, Focused","dry mouth, insomnia","Ideal for daytime use and outdoor activities","7.5","7","7.25"
"Purple Haze","Sativa-dominant strain with a distinctive purple hue and uplifting high.","Sativa-dominant Hybrid","Haze lineage","15-20%","Low","Myrcene, Limonene","Fruity, berry aroma with a hint of spice; colorful buds","Uplifted, Creative, Euphoric","dry mouth, dry eyes","Suitable for creative endeavors and social gatherings","6.25","6.5","6.38"
"Green Crack","Intense sativa-dominant strain known for its energizing and focused high.","Sativa-dominant","Afghani x Skunk #1","15-25%","Low","Myrcene, Pinene","Citrus and tropical fruit aroma; tight, potent buds","Energetic, Focused, Uplifted","dry mouth, anxiety","Perfect for daytime energy and focus","7.5","7.25","7.38"
"Jack Herer","Award-winning sativa-dominant hybrid celebrated for its clear-headed and creative high.","Sativa-dominant Hybrid","Haze x Northern Lights x Shiva Skunk","18-24%","Low","Terpinolene, Caryophyllene","Spicy, pine aroma with hints of citrus; frosty buds","Uplifted, Creative, Euphoric","dry mouth, paranoia","Ideal for creative tasks and stress relief","8","8","8.00"
"Chemdawg","Potent hybrid with a strong diesel aroma and robust cerebral high.","Hybrid","Likely Chemdawg #4 x Unknown","15-20%","Low","Myrcene, Caryophyllene","Pungent diesel scent with a hint of spice; dense buds","Focused, Euphoric, Relaxed","dry mouth, dry eyes","Used for mood enhancement and pain relief","6.25","6.5","6.38"
"Lemon Haze","Sativa-dominant hybrid with a zesty lemon flavor and invigorating high.","Sativa-dominant Hybrid","Lemon Skunk x Silver Haze","15-22%","Low","Limonene, Terpinolene","Bright citrus aroma with a sweet undertone; light, airy buds","Energized, Uplifted, Happy","dry mouth, anxiety","Great for daytime use and creative activities","6.75","6.5","6.63"
"Northern Lights","Classic indica-dominant strain known for its deeply relaxing and sedative effects.","Indica-dominant","Afghani x Thai","16-21%","Low","Myrcene, Pinene","Sweet and spicy aroma with resinous, compact buds","Relaxed, Sleepy, Euphoric","dry mouth, drowsiness","Ideal for pain relief and insomnia","6.75","6.25","6.50"
"Critical Mass","Indica-dominant strain famous for its heavy yields and potent body high.","Indica-dominant","Afghani x Skunk #1","19-21%","Low","Myrcene, Caryophyllene","Earthy and sweet aroma; large, dense buds","Relaxed, Sedated, Happy","dry mouth, couch-lock","Suitable for chronic pain and stress relief","7.5","7","7.25"
"Bubble Gum","Balanced hybrid with a sweet, bubble gum flavor and uplifting effects.","Hybrid","Unknown (landrace blend)","15-20%","Low","Caryophyllene, Limonene","Sweet, fruity aroma reminiscent of bubble gum; soft buds","Happy, Euphoric, Relaxed","dry mouth, dizziness","Good for mood elevation and mild pain relief","6.25","6","6.13"
"Amnesia Haze","Sativa-dominant hybrid known for its potent, uplifting high and complex flavor profile.","Sativa-dominant Hybrid","Haze lineage","20-25%","Low","Terpinolene, Myrcene","Earthy and citrus aroma with a hint of spice; airy buds","Uplifted, Creative, Euphoric","dry mouth, paranoia","Ideal for creative tasks and social settings","8.75","8.25","8.50"
"Strawberry Cough","Sativa-dominant strain celebrated for its sweet strawberry aroma and smooth, uplifting high.","Sativa-dominant","Possibly Haze-based","15-20%","Low","Limonene, Myrcene","Sweet berry scent with a subtle herbal note; light buds","Uplifted, Euphoric, Focused","dry mouth, coughing","Great for stress relief and creative pursuits","6.25","6","6.13"
"Maui Wowie","Tropical sativa-dominant strain delivering an energetic high with a fruity, exotic flavor.","Sativa-dominant","Hawaiian Landrace","15-20%","Low","Limonene, Terpinolene","Tropical pineapple and citrus aroma; light, airy buds","Energizing, Uplifted, Creative","dry mouth, dizziness","Perfect for daytime energy and relaxation","6.25","6.5","6.38"
"Grape Ape","Indica-dominant strain known for its distinct grape aroma and deeply relaxing effects.","Indica-dominant","Afghani x Mendocino Purps","15-22%","Low","Myrcene, Pinene","Sweet, grape-like aroma; colorful, dense buds","Relaxed, Sedated, Happy","dry mouth, drowsiness","Ideal for stress relief and pain management","6.75","6.5","6.63"
"Blueberry","Indica-dominant strain with a renowned blueberry aroma and soothing effects.","Indica-dominant","Blueberry x Afghan","16-24%","Low","Myrcene, Pinene","Sweet blueberry scent with earthy undertones; frosty buds","Relaxed, Euphoric, Sleepy","dry mouth, drowsiness","Used for relaxation and mild pain relief","7.5","7","7.25"
"Cherry Pie","Hybrid strain offering a sweet and tart cherry flavor with balanced effects.","Hybrid","Granddaddy Purple x Durban Poison","16-22%","Low","Limonene, Caryophyllene","Sweet, tart cherry aroma; sticky, dense buds","Happy, Relaxed, Euphoric","dry mouth, dry eyes","Suitable for mood elevation and pain relief","7","7","7.00"
"Super Silver Haze","Sativa-dominant hybrid with a potent, energetic high and complex citrus-spice profile.","Sativa-dominant Hybrid","Skunk, Northern Lights, Haze","18-23%","Low","Terpinolene, Myrcene","Citrus and earthy aroma with spicy notes; frosty buds","Energized, Uplifted, Focused","dry mouth, anxiety","Ideal for daytime creativity and stress relief","7.75","7.5","7.63"
"Bruce Banner","Potent hybrid known for its explosive high and pungent, sweet diesel aroma.","Hybrid","OG Kush x Strawberry Diesel","20-25%","Low","Myrcene, Caryophyllene","Sweet, diesel-like aroma with a hint of fruit; dense buds","Euphoric, Energetic, Creative","dry mouth, paranoia","Used for mood enhancement and pain management","8.75","8.5","8.63"
"Wedding Cake","Indica-dominant hybrid with a rich, tangy flavor and a potent, relaxing high.","Indica-dominant Hybrid","Cherry Pie x Girl Scout Cookies","20-25%","Low","Caryophyllene, Limonene","Sweet, earthy aroma with a hint of vanilla; dense buds","Relaxed, Happy, Euphoric","dry mouth, drowsiness","Ideal for stress relief and pain management","8.75","8.25","8.50"
"Gelato","Balanced hybrid celebrated for its dessert-like flavor and euphoric, calming effects.","Hybrid","Sunset Sherbet x Thin Mint GSC","20-25%","Low","Limonene, Caryophyllene","Sweet, creamy aroma with hints of citrus; sticky buds","Relaxed, Happy, Uplifted","dry mouth, dizziness","Great for relaxation and mood enhancement","8.75","8.5","8.63"
"Sunset Sherbet","Indica-dominant hybrid known for its fruity dessert flavor and soothing high.","Indica-dominant Hybrid","Girl Scout Cookies x Pink Panties","18-22%","Low","Limonene, Myrcene","Fruity, sherbet-like aroma; vibrant, dense buds","Relaxed, Euphoric, Happy","dry mouth, drowsiness","Suitable for evening relaxation and stress relief","7.5","7","7.25"
"GMO (Garlic Cookies)","Indica-dominant hybrid with a pungent garlic aroma and deeply relaxing effects.","Indica-dominant Hybrid","Chemdawg x GSC","18-25%","Low","Caryophyllene, Myrcene","Pungent, savory aroma with earthy undertones; sticky buds","Relaxed, Sedated, Euphoric","dry mouth, dry eyes","Ideal for pain relief and stress reduction","8.25","8","8.13"
"Do-Si-Dos","Indica-dominant hybrid offering a sweet and earthy flavor with potent relaxing effects.","Indica-dominant Hybrid","Girl Scout Cookies x Face Off OG","18-22%","Low","Limonene, Caryophyllene","Sweet, floral aroma with hints of mint; dense, resinous buds","Relaxed, Euphoric, Sedated","dry mouth, drowsiness","Used for anxiety relief and relaxation","7.5","7","7.25"
"Runtz","Balanced hybrid known for its sweet, candy-like flavor and powerful, euphoric high.","Hybrid","Zkittlez x Gelato","19-29%","Low","Limonene, Caryophyllene","Fruity, candy-like aroma; vibrant, colorful buds","Happy, Euphoric, Relaxed","dry mouth, dizziness","Ideal for creative pursuits and mood enhancement","9.5","9","9.25"
"Zkittlez","Indica-dominant hybrid with a sweet, fruity flavor and a relaxing, mellow high.","Indica-dominant Hybrid","Grape Ape x Grapefruit","15-22%","Low","Myrcene, Limonene","Intensely sweet, fruity aroma; compact, resinous buds","Relaxed, Happy, Euphoric","dry mouth, dry eyes","Great for stress relief and relaxation","6.75","6.5","6.63"
"Biscotti","Hybrid strain offering a rich, cookie-like flavor paired with a balanced high.","Hybrid","Girl Scout Cookies x South Florida OG","18-25%","Low","Limonene, Caryophyllene","Sweet, baked aroma with hints of spice; dense, trichome-rich buds","Happy, Relaxed, Uplifted","dry mouth, drowsiness","Suitable for creative tasks and relaxation","8.25","8","8.13"
"Tahoe OG","Indica-dominant strain with a robust, earthy pine flavor and potent body effects.","Indica-dominant","OG Kush lineage","20-25%","Low","Myrcene, Limonene","Earthy, pine aroma with a hint of spice; compact, sticky buds","Relaxed, Sedated, Euphoric","dry mouth, couch-lock","Ideal for pain relief and stress management","8.75","8.5","8.63"
"Forbidden Fruit","Hybrid strain known for its tropical, fruity flavor and deeply relaxing high.","Hybrid","Tangie x Cherry Pie","18-23%","Low","Limonene, Caryophyllene","Tropical, citrusy aroma with sweet undertones; resinous buds","Relaxed, Happy, Euphoric","dry mouth, drowsiness","Great for evening relaxation and mood enhancement","7.75","7.5","7.63"
"Agent Orange","Sativa-dominant hybrid offering a zesty citrus flavor and uplifting effects.","Sativa-dominant Hybrid","Orange Velvet x Jack the Ripper","18-25%","Low","Limonene, Terpinolene","Vibrant citrus aroma with sweet, tangy notes; frosty buds","Energized, Uplifted, Creative","dry mouth, dry eyes","Ideal for daytime use and creative inspiration","8.25","8","8.13"
"Sour Tangie","Sativa-dominant hybrid blending sour diesel with tangy citrus flavors for a vibrant high.","Sativa-dominant Hybrid","Sour Diesel x Tangie","18-24%","Low","Limonene, Caryophyllene","Tangy citrus aroma with a hint of sour diesel; dense buds","Energized, Uplifted, Focused","dry mouth, anxiety","Suitable for creative projects and daytime activities","8","7.75","7.88"
"Critical Kush","Indica-dominant hybrid merging heavy yields with a potent, relaxing high.","Indica-dominant Hybrid","Critical Mass x OG Kush","20-25%","Low","Myrcene, Caryophyllene","Earthy, pine aroma with subtle sweetness; chunky buds","Relaxed, Sedated, Happy","dry mouth, drowsiness","Great for pain relief and evening relaxation","8.75","8.25","8.50"
"Alaskan Thunder Fuck","Sativa-dominant hybrid known for its strong, uplifting high and pungent, piney aroma.","Sativa-dominant Hybrid","Afghani x Unknown","18-25%","Low","Pinene, Myrcene","Pungent, piney scent with earthy undertones; frosty, energizing buds","Energized, Uplifted, Creative","dry mouth, anxiety","Ideal for boosting energy and focus","8.25","8","8.13"
"Harlequin","CBD-rich sativa-dominant strain celebrated for its clear-headed, medicinal effects.","Sativa-dominant Hybrid","Colombian Gold x Nepalese","7-15%","High","Myrcene, Pinene","Earthy, herbal aroma with subtle sweetness; lighter buds","Clear-headed, Relaxed, Focused","dry mouth, dizziness","Used for pain relief and anxiety management","3","3.5","3.25"
"Cannatonic","Balanced hybrid renowned for its low THC and high CBD content, offering gentle relief.","Hybrid","MK Ultra x G13","6-17%","High","Limonene, Caryophyllene","Earthy and citrus aroma; soft, resinous buds","Calm, Relaxed, Focused","dry mouth, fatigue","Ideal for medical use and anxiety relief","3.25","3.5","3.38"
"Charlotte's Web","CBD-dominant strain with minimal psychoactive effects, designed for therapeutic use.","CBD-dominant","High CBD phenotype of hemp","0-0.3%","Very High","Myrcene, Limonene","Mild, herbal aroma; less resinous buds","Calm, Focused, Clear-headed","none","Used for epilepsy and chronic pain management","0.5","0.5","0.5"
"Remedy","Balanced hybrid with high CBD content offering mild relaxation without strong psychoactive effects.","Hybrid","CBD-rich phenotype","1-4%","High","Limonene, Caryophyllene","Earthy, citrus notes; soft buds","Relaxed, Clear-headed, Calm","dry mouth, sedation","Ideal for anxiety and pain relief","3.5","3.75","3.63"
"Pennywise","Indica-dominant strain with a near 1:1 THC to CBD ratio, offering balanced effects.","Indica-dominant Hybrid","Harle-Tsu x Jack the Ripper","4-8%","Balanced","Myrcene, Caryophyllene","Earthy aroma with subtle spice; compact buds","Calm, Focused, Euphoric","dry mouth, dizziness","Suitable for medical use and stress relief","3.5","3.75","3.63"
"Canna-Tsu","Hybrid strain featuring balanced levels of THC and CBD for a mild, uplifting experience.","Hybrid","Cannatonic x Sour Tsunami","4-8%","Balanced","Limonene, Pinene","Subtle citrus aroma with herbal notes; light buds","Calm, Happy, Clear-headed","dry mouth, fatigue","Used for mild pain and anxiety relief","3.5","3.75","3.63"
"ACDC","CBD-dominant strain with minimal psychoactive effects, prized for its therapeutic benefits.","CBD-dominant","Cannatonic phenotype","1-6%","Very High","Myrcene, Limonene","Earthy, herbal aroma; non-resinous buds","Clear-headed, Relaxed, Focused","none","Ideal for chronic pain, inflammation, anxiety","1.5","1.75","1.63"
"Ringo's Gift","Hybrid strain with high CBD offering a balanced and clear-headed experience.","Hybrid","Harle-Tsu x ACDC","Varies (1:1–24:1 ratio)","High","Limonene, Caryophyllene","Mild, earthy aroma with sweet undertones; moderate buds","Calm, Focused, Relaxed","dry mouth, sedation","Used for pain, anxiety, seizure management","2","2.25","2.13"
"Sour Tsunami","CBD-dominant strain known for its low THC content and effective pain relief properties.","CBD-dominant","Sour Diesel phenotype","6-10%","High","Limonene, Myrcene","Tangy, diesel aroma with earthy notes; less resinous","Calm, Relaxed, Focused","dry mouth, sedation","Ideal for chronic pain and inflammation","1.5","1.75","1.63"
"Harle-Tsu","Balanced CBD-rich hybrid offering mild euphoria with significant therapeutic benefits.","Hybrid","Harlequin x Canna-Tsu","4-10%","High","Myrcene, Caryophyllene","Earthy, herbal scent with subtle citrus; light buds","Clear-headed, Calm, Relaxed","dry mouth, fatigue","Used for anxiety and pain relief","2","2.25","2.13"
"Blue Cheese","Indica-dominant hybrid with a pungent, cheese-like aroma and deeply relaxing effects.","Indica-dominant Hybrid","Blueberry x UK Cheese","18-22%","Low","Myrcene, Caryophyllene","Strong cheesy aroma with sweet berry undertones; dense buds","Relaxed, Euphoric, Sedated","dry mouth, drowsiness","Great for stress relief and relaxation","7.5","7.25","7.38"
"Orange Bud","Sativa-dominant strain celebrated for its vibrant citrus flavor and uplifting effects.","Sativa-dominant","Afghani x Thai","15-22%","Low","Limonene, Terpinolene","Bright citrus aroma with a hint of spice; light, airy buds","Energetic, Uplifted, Happy","dry mouth, dry eyes","Ideal for daytime use and mood elevation","6.75","6.5","6.63"
"LA Confidential","Indica-dominant strain known for its smooth, pine and spice flavors and calming effects.","Indica-dominant","Afghani x OG Kush","16-22%","Low","Myrcene, Limonene","Earthy, pine aroma with subtle sweetness; resinous buds","Relaxed, Sedated, Euphoric","dry mouth, drowsiness","Used for stress relief and insomnia","7","7","7.00"
"God's Gift","Indica-dominant hybrid offering a powerful, euphoric high with a sweet, grape aroma.","Indica-dominant Hybrid","Granddaddy Purple x OG Kush","20-25%","Low","Myrcene, Caryophyllene","Rich, sweet grape aroma with sticky, dense buds","Relaxed, Euphoric, Sedated","dry mouth, couch-lock","Ideal for pain relief and stress management","8.75","8.5","8.63"
"NYC Diesel","Sativa-dominant strain with a strong diesel aroma and uplifting, creative effects.","Sativa-dominant","Diesel x Unknown","18-25%","Low","Limonene, Caryophyllene","Pungent diesel scent with hints of citrus; frosty buds","Energized, Creative, Uplifted","dry mouth, anxiety","Great for daytime creativity and focus","8.25","8","8.13"
"Skunk #1","Classic hybrid known for its strong, skunky aroma and balanced, long-lasting effects.","Hybrid","Skunk #1 lineage","15-20%","Low","Myrcene, Caryophyllene","Pungent, skunky odor with earthy undertones; sticky buds","Happy, Relaxed, Euphoric","dry mouth, drowsiness","Ideal for stress relief and mood elevation","6.25","6","6.13"
"Lemon Skunk","Hybrid strain offering a zesty lemon flavor and an energetic, uplifting high.","Hybrid","Skunk x Lemon Thai","15-22%","Low","Limonene, Terpinolene","Bright lemon aroma with skunky undertones; light buds","Energized, Uplifted, Happy","dry mouth, anxiety","Great for daytime use and creative tasks","6.75","6.5","6.63"
"Master Kush","Indica-dominant strain renowned for its earthy, spicy flavor and deeply calming effects.","Indica-dominant","Afghani lineage","15-22%","Low","Myrcene, Limonene","Earthy, herbal aroma with a subtle spice; dense buds","Relaxed, Sedated, Euphoric","dry mouth, drowsiness","Ideal for stress relief and pain management","6.75","6.5","6.63"
"Hindu Kush","Pure indica known for its earthy, woody flavors and deeply relaxing effects.","Indica (Pure)","Hindu Kush Landrace","16-21%","Low","Myrcene, Pinene","Earthy, woody aroma with a hint of spice; compact buds","Calm, Relaxed, Sedated","dry mouth, couch-lock","Used for relaxation and pain relief","6.75","6.5","6.63"
"Afghani","Pure indica landrace with a strong, earthy aroma and heavy, sedative effects.","Indica (Pure)","Afghani Landrace","18-23%","Low","Myrcene, Caryophyllene","Earthy, hash-like aroma; resinous, dense buds","Relaxed, Sedated, Euphoric","dry mouth, drowsiness","Ideal for pain relief and insomnia","7.5","7.25","7.38"
"Pakistani Chitral Kush","Robust pure indica with a distinct earthy and spicy flavor profile and potent effects.","Indica (Pure)","Pakistani Landrace","18-25%","Low","Myrcene, Pinene","Earthy, spicy aroma with resinous buds","Relaxed, Sedated, Euphoric","dry mouth, couch-lock","Used for chronic pain and insomnia","8.25","8","8.13"
"Blueberry Kush","Hybrid strain combining fruity blueberry flavors with classic Kush earthiness.","Hybrid","Blueberry x Kush","18-24%","Low","Myrcene, Caryophyllene","Sweet blueberry aroma with earthy, herbal notes; dense buds","Relaxed, Happy, Euphoric","dry mouth, drowsiness","Ideal for stress relief and mood enhancement","8","7.75","7.88"
"Cherry OG","Hybrid strain known for its sweet cherry flavor and potent, balanced high.","Hybrid","Cherry Pie x OG Kush","20-26%","Low","Limonene, Caryophyllene","Sweet cherry aroma with earthy undertones; sticky buds","Relaxed, Euphoric, Creative","dry mouth, dry eyes","Used for stress relief and pain management","9","8.75","8.88"
"Jack Flash","Indica-dominant hybrid delivering a potent, sedative high with a spicy, herbal flavor.","Indica-dominant Hybrid","Jack the Ripper x Flashback","20-25%","Low","Myrcene, Caryophyllene","Herbal, spicy aroma with a hint of citrus; dense buds","Relaxed, Sedated, Euphoric","dry mouth, drowsiness","Ideal for nighttime use and pain relief","8.75","8.5","8.63"
"White Rhino","Indica-dominant strain known for its heavy, resinous buds and powerful body high.","Indica-dominant","Afghani x Unknown","18-22%","Low","Myrcene, Caryophyllene","Earthy, pine aroma with a hint of sweetness; chunky buds","Relaxed, Sedated, Euphoric","dry mouth, couch-lock","Used for severe pain and stress relief","7.5","7.25","7.38"
"Alien OG","Hybrid strain celebrated for its potent, spacey high and complex pine-citrus flavors.","Hybrid","Tahoe OG x Alien Kush","20-25%","Low","Limonene, Myrcene","Pine and citrus aroma with a touch of earthiness; frosty buds","Euphoric, Creative, Relaxed","dry mouth, dry eyes","Ideal for creative sessions and relaxation","8.75","8.5","8.63"
"Critical Jack","Hybrid that merges the uplifting effects of Jack Herer with the heavy yields of Critical Mass.","Hybrid","Jack Herer x Critical Mass","18-25%","Low","Myrcene, Caryophyllene","Balanced aroma with hints of spice and earth; robust buds","Happy, Relaxed, Euphoric","dry mouth, drowsiness","Great for stress relief and creative inspiration","8.25","8","8.13"
"Agent Diesel","Hybrid strain with a robust diesel aroma and a balanced, energizing high.","Hybrid","Diesel x Unknown","18-24%","Low","Limonene, Caryophyllene","Strong diesel scent with citrus hints; resinous buds","Energized, Uplifted, Focused","dry mouth, anxiety","Ideal for daytime focus and creativity","8","7.75","7.88"
"Candyland","Sativa-dominant hybrid offering a sweet, candy-like flavor with an uplifting high.","Sativa-dominant Hybrid","Unknown (landrace blend)","16-22%","Low","Limonene, Myrcene","Sweet, sugary aroma; light, airy buds","Happy, Euphoric, Energetic","dry mouth, dry eyes","Suitable for daytime energy and creativity","7","7","7.00"
"Tangie","Sativa-dominant strain famous for its strong citrus aroma and euphoric, uplifting effects.","Sativa-dominant Hybrid","Grapefruit x California Orange","18-25%","Low","Limonene, Terpinolene","Vibrant citrus scent with sweet undertones; frosty buds","Uplifted, Energetic, Creative","dry mouth, anxiety","Perfect for boosting mood and creativity","8.25","8","8.13"
"Chernobyl","Hybrid strain with an earthy, pungent aroma and a balanced mix of cerebral and body effects.","Hybrid","Unknown (landrace blend)","16-20%","Low","Myrcene, Caryophyllene","Earthy, spicy aroma; compact, dense buds","Balanced, Euphoric, Relaxed","dry mouth, dry eyes","Ideal for daytime use and mild pain relief","6.5","6.25","6.38"
"LSD","Sativa-dominant hybrid renowned for its psychedelic, mind-bending high and complex flavor profile.","Sativa-dominant Hybrid","Unknown (Haze lineage)","18-25%","Low","Terpinolene, Myrcene","Psychedelic, earthy aroma with hints of citrus; trichome-rich buds","Creative, Euphoric, Uplifted","dry mouth, paranoia","Great for creative exploration and social settings","8.25","8","8.13"
"Romulan","Indica-dominant strain delivering a potent, sedative high with an earthy, pine flavor.","Indica-dominant Hybrid","Indica landrace","20-26%","Low","Myrcene, Caryophyllene","Earthy, pine aroma with spicy undertones; dense buds","Relaxed, Sedated, Euphoric","dry mouth, couch-lock","Ideal for evening use and pain management","9","8.75","8.88"
"Berry White","Hybrid strain offering a sweet berry flavor with a balanced, uplifting high.","Hybrid","Unknown (landrace blend)","15-21%","Low","Limonene, Caryophyllene","Sweet berry aroma with subtle earthy notes; light buds","Happy, Euphoric, Relaxed","dry mouth, dry eyes","Great for mood elevation and relaxation","6.5","6.25","6.38"
"Blackberry Kush","Indica-dominant hybrid known for its rich, blackberry flavor and calming effects.","Indica-dominant Hybrid","Unknown (Kush lineage)","18-25%","Low","Myrcene, Limonene","Sweet, berry aroma with earthy, herbal notes; compact buds","Relaxed, Sedated, Happy","dry mouth, drowsiness","Ideal for stress relief and insomnia","8.25","8","8.13"
"Forbidden Berry","Hybrid strain combining sweet berry flavors with a potent, relaxing high.","Hybrid","Forbidden Fruit x Blackberry Kush","18-24%","Low","Limonene, Caryophyllene","Fruity, berry aroma with earthy undertones; resinous buds","Relaxed, Euphoric, Happy","dry mouth, dry eyes","Suitable for evening relaxation and mood enhancement","8","7.75","7.88"
"Sour OG","Hybrid strain featuring a sour, pungent aroma with powerful, sedative effects.","Hybrid","OG Kush x Sour Diesel","20-26%","Low","Myrcene, Caryophyllene","Sour, pungent aroma with earthy undertones; sticky buds","Relaxed, Sedated, Euphoric","dry mouth, couch-lock","Great for pain relief and heavy relaxation","9","8.5","8.75"
"God Bud","Indica-dominant strain revered for its heavy, sedative high and earthy, herbal flavor.","Indica-dominant Hybrid","Unknown (classic strain)","15-22%","Low","Myrcene, Caryophyllene","Earthy, herbal aroma with a subtle sweetness; dense buds","Relaxed, Sedated, Happy","dry mouth, drowsiness","Ideal for chronic pain and insomnia","6.75","6.5","6.63"
"Cheese","Indica-dominant hybrid noted for its pungent, cheesy aroma and balanced, relaxing effects.","Indica-dominant Hybrid","UK Cheese Landrace","18-22%","Low","Caryophyllene, Myrcene","Strong cheesy odor with earthy undertones; dense, sticky buds","Relaxed, Euphoric, Happy","dry mouth, dry eyes","Perfect for stress relief and creative pursuits","7.5","7.25","7.38"
"G13","Potent hybrid with a mysterious lineage offering a powerful, euphoric high.","Hybrid","Urban legend strain","20-26%","Low","Myrcene, Caryophyllene","Pungent, earthy aroma with hints of diesel; compact buds","Euphoric, Creative, Relaxed","dry mouth, dizziness","Ideal for experienced users seeking strong effects","9","8.75","8.88"
"Blueberry OG","Hybrid strain merging the sweet flavors of Blueberry with the potency of OG Kush.","Hybrid","Blueberry x OG Kush","18-25%","Low","Myrcene, Caryophyllene","Sweet blueberry aroma with earthy, pine undertones; resinous buds","Relaxed, Euphoric, Happy","dry mouth, drowsiness","Great for relaxation and mood enhancement","8.25","8","8.13"
"Cherry Bomb","Hybrid strain with an explosive cherry flavor and a dynamic, balanced high.","Hybrid","Cherry Pie x Unknown","18-24%","Low","Limonene, Caryophyllene","Bold cherry aroma with a hint of spice; dense buds","Euphoric, Energetic, Creative","dry mouth, dry eyes","Ideal for creative pursuits and social gatherings","8","8","8.00"
"Mango Kush","Indica-dominant hybrid offering a tropical mango flavor with deeply relaxing effects.","Indica-dominant Hybrid","Afghani x Mango","20-26%","Low","Myrcene, Limonene","Tropical mango aroma with earthy undertones; dense, resinous buds","Relaxed, Sedated, Euphoric","dry mouth, drowsiness","Used for stress relief and relaxation","9","8.75","8.88"
"Pineapple Chunk","Indica-dominant hybrid featuring a sweet pineapple aroma and a heavy, sedative high.","Indica-dominant Hybrid","Pineapple x Chunk","16-23%","Low","Limonene, Myrcene","Tropical pineapple scent with earthy notes; chunky buds","Relaxed, Sedated, Happy","dry mouth, couch-lock","Ideal for evening use and pain management","7.25","7","7.13"
"Jillybean","Hybrid strain known for its fruity, floral flavor and uplifting, creative effects.","Hybrid","Unknown (landrace blend)","15-20%","Low","Limonene, Caryophyllene","Fruity, floral aroma with a sweet finish; light buds","Uplifted, Euphoric, Creative","dry mouth, dry eyes","Great for daytime use and creative inspiration","6.25","6","6.13"
"Strawberry Banana","Hybrid strain combining sweet strawberry and banana flavors with a balanced high.","Hybrid","Unknown (blend)","18-26%","Low","Limonene, Myrcene","Sweet, tropical aroma with a creamy finish; resinous buds","Happy, Relaxed, Euphoric","dry mouth, dizziness","Ideal for mood elevation and relaxation","8.5","8.25","8.38"
"Tropicana Cookies","Sativa-dominant hybrid delivering a burst of citrus and cookie flavors with an energetic high.","Sativa-dominant Hybrid","Cookie genetics x Tangie","20-28%","Low","Limonene, Caryophyllene","Zesty citrus aroma with a sweet, baked undertone; frosty buds","Energized, Uplifted, Creative","dry mouth, dry eyes","Perfect for daytime creativity and social events","9.5","9","9.25"
"UK Cheese","Indica-dominant variant of Cheese known for its pungent aroma and relaxing, euphoric effects.","Indica-dominant Hybrid","UK Landrace","15-20%","Low","Caryophyllene, Myrcene","Strong cheesy odor with herbal undertones; sticky buds","Relaxed, Euphoric, Happy","dry mouth, dry eyes","Great for stress relief and relaxation","6.25","6","6.13"
"Raspberry Kush","Indica-dominant hybrid with a sweet raspberry flavor and a deeply calming high.","Indica-dominant Hybrid","Afghani x Unknown","18-24%","Low","Myrcene, Caryophyllene","Sweet raspberry aroma with earthy notes; dense buds","Relaxed, Sedated, Euphoric","dry mouth, drowsiness","Ideal for evening use and pain relief","8","7.75","7.88"
"Orange Cookies","Hybrid strain combining citrus and sweet cookie flavors with a balanced, uplifting high.","Hybrid","Girl Scout Cookies x Orange Velvet","18-25%","Low","Limonene, Caryophyllene","Citrus-infused aroma with sweet undertones; resinous buds","Happy, Relaxed, Uplifted","dry mouth, dry eyes","Suitable for mood enhancement and stress relief","8.25","8","8.13"
"White Tahoe Cookies","Indica-dominant hybrid featuring a sweet, citrusy flavor and potent, relaxing effects.","Indica-dominant Hybrid","Tahoe OG x Cookies","20-25%","Low","Limonene, Caryophyllene","Sweet citrus aroma with earthy hints; dense, sticky buds","Relaxed, Euphoric, Sedated","dry mouth, couch-lock","Ideal for evening relaxation and pain management","8.75","8.5","8.63"
"Fire OG","Indica-dominant strain known for its intense, spicy pine flavor and powerful sedative effects.","Indica-dominant Hybrid","OG Kush lineage","20-25%","Low","Myrcene, Limonene","Spicy, pine aroma with a hint of earthiness; chunky buds","Relaxed, Sedated, Euphoric","dry mouth, drowsiness","Used for severe pain relief and stress reduction","8.75","8.5","8.63"
"Headband","Hybrid strain recognized for its tight, band-like effect and a balanced cerebral and body high.","Hybrid","Super Silver Haze x OG Kush","18-22%","Low","Myrcene, Caryophyllene","Subtle, earthy aroma with hints of diesel; compact buds","Euphoric, Relaxed, Focused","dry mouth, fatigue","Great for migraine relief and creative focus","7.5","7.25","7.38"
"Jack the Ripper","Potent hybrid with a sharp, spicy flavor and a fast-acting, cerebral high.","Hybrid","Jack Herer x Unknown","18-24%","Low","Limonene, Caryophyllene","Spicy, herbal aroma with a hint of citrus; dense buds","Euphoric, Creative, Energetic","dry mouth, dry eyes","Ideal for creative inspiration and stress relief","8","8","8.00"
"Cinderella 99","Sativa-dominant hybrid known for its uplifting, energetic high and sweet, citrus flavor.","Sativa-dominant Hybrid","Unknown (landrace blend)","18-24%","Low","Limonene, Terpinolene","Sweet citrus aroma with floral hints; airy buds","Energized, Uplifted, Creative","dry mouth, anxiety","Great for daytime energy and creativity","8","8.25","8.13"
"Blue Cookies","Hybrid strain combining sweet blueberry flavors with a calming, balanced high.","Hybrid","Blueberry x Girl Scout Cookies","20-25%","Low","Myrcene, Caryophyllene","Sweet blueberry aroma with earthy undertones; resinous buds","Relaxed, Euphoric, Happy","dry mouth, drowsiness","Ideal for relaxation and mood enhancement","8.75","8.5","8.63"
"Mimosa","Sativa-dominant hybrid offering a vibrant citrus and sweet, tangy flavor with an uplifting high.","Sativa-dominant Hybrid","Citrus x Purple Punch","20-25%","Low","Limonene, Caryophyllene","Bright citrus aroma with sweet, fruity notes; light buds","Energized, Uplifted, Happy","dry mouth, dry eyes","Perfect for daytime use and social gatherings","8.75","8.5","8.63"
"LA Kush","Hybrid strain known for its spicy, earthy flavor and balanced, calming effects.","Hybrid","LA x Kush lineage","17-22%","Low","Myrcene, Limonene","Earthy, spicy aroma with subtle floral hints; moderate buds","Relaxed, Euphoric, Focused","dry mouth, drowsiness","Ideal for stress relief and relaxation","7.25","7","7.13"
"Amnesia Lemon","Sativa-dominant hybrid blending citrus and earthy flavors for an energizing, creative high.","Sativa-dominant Hybrid","Amnesia x Lemon Skunk","18-24%","Low","Limonene, Terpinolene","Bright lemon aroma with earthy undertones; light, airy buds","Energized, Uplifted, Creative","dry mouth, anxiety","Great for daytime creativity and mood boost","8","8","8.00"
"Forbidden Jack","Hybrid strain merging tropical fruit notes with a potent, balanced high for a unique experience.","Hybrid","Forbidden Fruit x Jack Herer","19-25%","Low","Limonene, Caryophyllene","Tropical, fruity aroma with spicy hints; resinous buds","Euphoric, Relaxed, Creative","dry mouth, drowsiness","Ideal for creative sessions and stress relief","8.5","8.25","8.38"
`;
}


export const SAMPLE_STRAINS = [
  {
    name: "Trainwreck",
    overview: "Sativa-dominant hybrid known for its explosive cerebral high and rapid onset.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Mexican, Thai, Afghani",
    thc_range: "18-22%",
    cbd_level: "Minimal",
    dominant_terpenes: "Myrcene, Pinene",
    qualitative_insights: "Spicy, citrus aroma with a hint of pine; dense, energetic buds",
    effects: "Energized, Creative, Uplifted",
    negatives: "dry mouth, dry eyes, dizziness",
    uses: "Ideal for creative pursuits, social settings, combating fatigue",
    thc_rating: 7.5,
    user_rating: 7.0,
    combined_rating: 7.25
  },
  {
    name: "Blue Dream",
    overview: "Balanced sativa-dominant hybrid offering gentle cerebral invigoration and full-body relaxation.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Blueberry x Haze",
    thc_range: "17-24%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Pinene, Caryophyllene",
    qualitative_insights: "Sweet berry aroma with earthy undertones; smooth buds",
    effects: "Euphoric, Relaxed, Creative",
    negatives: "dry mouth, dry eyes",
    uses: "Great for stress relief, daytime use, creative tasks",
    thc_rating: 7.75,
    user_rating: 7.5,
    combined_rating: 7.63
  },
  {
    name: "Girl Scout Cookies",
    overview: "Popular hybrid known for its euphoric and relaxing effects with a sweet, earthy aroma.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "OG Kush x Durban Poison",
    thc_range: "18-28%",
    cbd_level: "Low",
    dominant_terpenes: "Caryophyllene, Limonene",
    qualitative_insights: "Sweet, earthy scent with hints of mint; dense, resinous buds",
    effects: "Happy, Relaxed, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Effective for pain relief and mood elevation",
    thc_rating: 9,
    user_rating: 8.5,
    combined_rating: 8.75
  },
  {
    name: "Sour Diesel",
    overview: "Energetic sativa-dominant strain with a pungent diesel aroma.",
    genetic_type: "Sativa-dominant",
    lineage: "Chemdawg x Super Skunk",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Pungent, fuel-like scent with citrus hints; airy buds",
    effects: "Energetic, Uplifted, Focused",
    negatives: "dry mouth, anxiety",
    uses: "Ideal for daytime use and creative projects",
    thc_rating: 8.75,
    user_rating: 8,
    combined_rating: 8.38
  },
  {
    name: "OG Kush",
    overview: "Iconic hybrid delivering a balanced high with earthy pine and citrus flavors.",
    genetic_type: "Hybrid",
    lineage: "Chemdawg x Hindu Kush",
    thc_range: "19-26%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Limonene",
    qualitative_insights: "Earthy, pine aroma with a touch of citrus; dense, resinous buds",
    effects: "Relaxed, Euphoric, Uplifted",
    negatives: "dry mouth, dry eyes",
    uses: "Used for stress relief and pain management",
    thc_rating: 8.75,
    user_rating: 8,
    combined_rating: 8.38
  },
  {
    name: "Pineapple Express",
    overview: "Tropical sativa-dominant hybrid offering a sweet, fruity flavor and energetic high.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Trainwreck x Hawaiian",
    thc_range: "19-25%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Myrcene",
    qualitative_insights: "Tropical pineapple aroma with hints of earthiness; vibrant buds",
    effects: "Energetic, Uplifted, Creative",
    negatives: "dry mouth, dry eyes",
    uses: "Perfect for social settings and daytime activities",
    thc_rating: 8.5,
    user_rating: 8,
    combined_rating: 8.25
  },
  {
    name: "Granddaddy Purple",
    overview: "Renowned indica-dominant strain with a deep purple hue and grape-like aroma.",
    genetic_type: "Indica-dominant",
    lineage: "Purple Urkle x Big Bud",
    thc_range: "17-23%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Pinene",
    qualitative_insights: "Sweet, grape aroma with a relaxing, heavy bud structure",
    effects: "Relaxed, Sleepy, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for pain relief and insomnia",
    thc_rating: 7.5,
    user_rating: 7,
    combined_rating: 7.25
  },
  {
    name: "White Widow",
    overview: "Balanced hybrid known for its potent resin production and earthy pine flavor.",
    genetic_type: "Hybrid",
    lineage: "Brazilian Sativa x South Indian Indica",
    thc_range: "18-25%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Earthy, woody aroma with a subtle sweet note; frosty buds",
    effects: "Energetic, Euphoric, Creative",
    negatives: "dry mouth, dry eyes",
    uses: "Suitable for stress relief and social use",
    thc_rating: 8.25,
    user_rating: 8,
    combined_rating: 8.13
  },
  {
    name: "AK-47",
    overview: "Sativa-dominant hybrid offering a mellow, long-lasting cerebral high with a sweet, sour flavor.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Colombian, Mexican, Thai, Afghani",
    thc_range: "13-20%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Limonene",
    qualitative_insights: "Sweet and sour aroma with a light, airy bud structure",
    effects: "Relaxed, Uplifted, Creative",
    negatives: "dry mouth, fatigue",
    uses: "Great for relaxation and creative inspiration",
    thc_rating: 5.75,
    user_rating: 6,
    combined_rating: 5.88
  },
  {
    name: "Durban Poison",
    overview: "Pure sativa known for its energizing effects and sweet, earthy aroma.",
    genetic_type: "Pure Sativa",
    lineage: "South African Landrace",
    thc_range: "15-25%",
    cbd_level: "Low",
    dominant_terpenes: "Terpinolene, Myrcene",
    qualitative_insights: "Sweet, earthy scent with hints of pine; light, fluffy buds",
    effects: "Energizing, Uplifting, Focused",
    negatives: "dry mouth, insomnia",
    uses: "Ideal for daytime use and outdoor activities",
    thc_rating: 7.5,
    user_rating: 7,
    combined_rating: 7.25
  },
  {
    name: "Purple Haze",
    overview: "Sativa-dominant strain with a distinctive purple hue and uplifting high.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Haze lineage",
    thc_range: "15-20%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Limonene",
    qualitative_insights: "Fruity, berry aroma with a hint of spice; colorful buds",
    effects: "Uplifted, Creative, Euphoric",
    negatives: "dry mouth, dry eyes",
    uses: "Suitable for creative endeavors and social gatherings",
    thc_rating: 6.25,
    user_rating: 6.5,
    combined_rating: 6.38
  },
  {
    name: "Green Crack",
    overview: "Intense sativa-dominant strain known for its energizing and focused high.",
    genetic_type: "Sativa-dominant",
    lineage: "Afghani x Skunk #1",
    thc_range: "15-25%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Pinene",
    qualitative_insights: "Citrus and tropical fruit aroma; tight, potent buds",
    effects: "Energetic, Focused, Uplifted",
    negatives: "dry mouth, anxiety",
    uses: "Perfect for daytime energy and focus",
    thc_rating: 7.5,
    user_rating: 7.25,
    combined_rating: 7.38
  },
  {
    name: "Jack Herer",
    overview: "Award-winning sativa-dominant hybrid celebrated for its clear-headed and creative high.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Haze x Northern Lights x Shiva Skunk",
    thc_range: "18-24%",
    cbd_level: "Low",
    dominant_terpenes: "Terpinolene, Caryophyllene",
    qualitative_insights: "Spicy, pine aroma with hints of citrus; frosty buds",
    effects: "Uplifted, Creative, Euphoric",
    negatives: "dry mouth, paranoia",
    uses: "Ideal for creative tasks and stress relief",
    thc_rating: 8,
    user_rating: 8,
    combined_rating: 8.00
  },
  {
    name: "Chemdawg",
    overview: "Potent hybrid with a strong diesel aroma and robust cerebral high.",
    genetic_type: "Hybrid",
    lineage: "Likely Chemdawg #4 x Unknown",
    thc_range: "15-20%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Pungent diesel scent with a hint of spice; dense buds",
    effects: "Focused, Euphoric, Relaxed",
    negatives: "dry mouth, dry eyes",
    uses: "Used for mood enhancement and pain relief",
    thc_rating: 6.25,
    user_rating: 6.5,
    combined_rating: 6.38
  },
  {
    name: "Lemon Haze",
    overview: "Sativa-dominant hybrid with a zesty lemon flavor and invigorating high.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Lemon Skunk x Silver Haze",
    thc_range: "15-22%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Terpinolene",
    qualitative_insights: "Bright citrus aroma with a sweet undertone; light, airy buds",
    effects: "Energized, Uplifted, Happy",
    negatives: "dry mouth, anxiety",
    uses: "Great for daytime use and creative activities",
    thc_rating: 6.75,
    user_rating: 6.5,
    combined_rating: 6.63
  },
  {
    name: "Northern Lights",
    overview: "Classic indica-dominant strain known for its deeply relaxing and sedative effects.",
    genetic_type: "Indica-dominant",
    lineage: "Afghani x Thai",
    thc_range: "16-21%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Pinene",
    qualitative_insights: "Sweet and spicy aroma with resinous, compact buds",
    effects: "Relaxed, Sleepy, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for pain relief and insomnia",
    thc_rating: 6.75,
    user_rating: 6.25,
    combined_rating: 6.50
  },
  {
    name: "Critical Mass",
    overview: "Indica-dominant strain famous for its heavy yields and potent body high.",
    genetic_type: "Indica-dominant",
    lineage: "Afghani x Skunk #1",
    thc_range: "19-21%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Earthy and sweet aroma; large, dense buds",
    effects: "Relaxed, Sedated, Happy",
    negatives: "dry mouth, couch-lock",
    uses: "Suitable for chronic pain and stress relief",
    thc_rating: 7.5,
    user_rating: 7,
    combined_rating: 7.25
  },
  {
    name: "Bubble Gum",
    overview: "Balanced hybrid with a sweet, bubble gum flavor and uplifting effects.",
    genetic_type: "Hybrid",
    lineage: "Unknown (landrace blend)",
    thc_range: "15-20%",
    cbd_level: "Low",
    dominant_terpenes: "Caryophyllene, Limonene",
    qualitative_insights: "Sweet, fruity aroma reminiscent of bubble gum; soft buds",
    effects: "Happy, Euphoric, Relaxed",
    negatives: "dry mouth, dizziness",
    uses: "Good for mood elevation and mild pain relief",
    thc_rating: 6.25,
    user_rating: 6,
    combined_rating: 6.13
  },
  {
    name: "Amnesia Haze",
    overview: "Sativa-dominant hybrid known for its potent, uplifting high and complex flavor profile.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Haze lineage",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Terpinolene, Myrcene",
    qualitative_insights: "Earthy and citrus aroma with a hint of spice; airy buds",
    effects: "Uplifted, Creative, Euphoric",
    negatives: "dry mouth, paranoia",
    uses: "Ideal for creative tasks and social settings",
    thc_rating: 8.75,
    user_rating: 8.25,
    combined_rating: 8.50
  },
  {
    name: "Strawberry Cough",
    overview: "Sativa-dominant strain celebrated for its sweet strawberry aroma and smooth, uplifting high.",
    genetic_type: "Sativa-dominant",
    lineage: "Possibly Haze-based",
    thc_range: "15-20%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Myrcene",
    qualitative_insights: "Sweet berry scent with a subtle herbal note; light buds",
    effects: "Uplifted, Euphoric, Focused",
    negatives: "dry mouth, coughing",
    uses: "Great for stress relief and creative pursuits",
    thc_rating: 6.25,
    user_rating: 6,
    combined_rating: 6.13
  },
  {
    name: "Maui Wowie",
    overview: "Tropical sativa-dominant strain delivering an energetic high with a fruity, exotic flavor.",
    genetic_type: "Sativa-dominant",
    lineage: "Hawaiian Landrace",
    thc_range: "15-20%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Terpinolene",
    qualitative_insights: "Tropical pineapple and citrus aroma; light, airy buds",
    effects: "Energizing, Uplifted, Creative",
    negatives: "dry mouth, dizziness",
    uses: "Perfect for daytime energy and relaxation",
    thc_rating: 6.25,
    user_rating: 6.5,
    combined_rating: 6.38
  },
  {
    name: "Grape Ape",
    overview: "Indica-dominant strain known for its distinct grape aroma and deeply relaxing effects.",
    genetic_type: "Indica-dominant",
    lineage: "Afghani x Mendocino Purps",
    thc_range: "15-22%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Pinene",
    qualitative_insights: "Sweet, grape-like aroma; colorful, dense buds",
    effects: "Relaxed, Sedated, Happy",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for stress relief and pain management",
    thc_rating: 6.75,
    user_rating: 6.5,
    combined_rating: 6.63
  },
  {
    name: "Blueberry",
    overview: "Indica-dominant strain with a renowned blueberry aroma and soothing effects.",
    genetic_type: "Indica-dominant",
    lineage: "Blueberry x Afghan",
    thc_range: "16-24%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Pinene",
    qualitative_insights: "Sweet blueberry scent with earthy undertones; frosty buds",
    effects: "Relaxed, Euphoric, Sleepy",
    negatives: "dry mouth, drowsiness",
    uses: "Used for relaxation and mild pain relief",
    thc_rating: 7.5,
    user_rating: 7,
    combined_rating: 7.25
  },
  {
    name: "Cherry Pie",
    overview: "Hybrid strain offering a sweet and tart cherry flavor with balanced effects.",
    genetic_type: "Hybrid",
    lineage: "Granddaddy Purple x Durban Poison",
    thc_range: "16-22%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Sweet, tart cherry aroma; sticky, dense buds",
    effects: "Happy, Relaxed, Euphoric",
    negatives: "dry mouth, dry eyes",
    uses: "Suitable for mood elevation and pain relief",
    thc_rating: 7,
    user_rating: 7,
    combined_rating: 7.00
  },
  {
    name: "Super Silver Haze",
    overview: "Sativa-dominant hybrid with a potent, energetic high and complex citrus-spice profile.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Skunk, Northern Lights, Haze",
    thc_range: "18-23%",
    cbd_level: "Low",
    dominant_terpenes: "Terpinolene, Myrcene",
    qualitative_insights: "Citrus and earthy aroma with spicy notes; frosty buds",
    effects: "Energized, Uplifted, Focused",
    negatives: "dry mouth, anxiety",
    uses: "Ideal for daytime creativity and stress relief",
    thc_rating: 7.75,
    user_rating: 7.5,
    combined_rating: 7.63
  },
  {
    name: "Bruce Banner",
    overview: "Potent hybrid known for its explosive high and pungent, sweet diesel aroma.",
    genetic_type: "Hybrid",
    lineage: "OG Kush x Strawberry Diesel",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Sweet, diesel-like aroma with a hint of fruit; dense buds",
    effects: "Euphoric, Energetic, Creative",
    negatives: "dry mouth, paranoia",
    uses: "Used for mood enhancement and pain management",
    thc_rating: 8.75,
    user_rating: 8.5,
    combined_rating: 8.63
  },
  {
    name: "Wedding Cake",
    overview: "Indica-dominant hybrid with a rich, tangy flavor and a potent, relaxing high.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Cherry Pie x Girl Scout Cookies",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Caryophyllene, Limonene",
    qualitative_insights: "Sweet, earthy aroma with a hint of vanilla; dense buds",
    effects: "Relaxed, Happy, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for stress relief and pain management",
    thc_rating: 8.75,
    user_rating: 8.25,
    combined_rating: 8.50
  },
  {
    name: "Gelato",
    overview: "Balanced hybrid celebrated for its dessert-like flavor and euphoric, calming effects.",
    genetic_type: "Hybrid",
    lineage: "Sunset Sherbet x Thin Mint GSC",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Sweet, creamy aroma with hints of citrus; sticky buds",
    effects: "Relaxed, Happy, Uplifted",
    negatives: "dry mouth, dizziness",
    uses: "Great for relaxation and mood enhancement",
    thc_rating: 8.75,
    user_rating: 8.5,
    combined_rating: 8.63
  },
  {
    name: "Sunset Sherbet",
    overview: "Indica-dominant hybrid known for its fruity dessert flavor and soothing high.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Girl Scout Cookies x Pink Panties",
    thc_range: "18-22%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Myrcene",
    qualitative_insights: "Fruity, sherbet-like aroma; vibrant, dense buds",
    effects: "Relaxed, Euphoric, Happy",
    negatives: "dry mouth, drowsiness",
    uses: "Suitable for evening relaxation and stress relief",
    thc_rating: 7.5,
    user_rating: 7,
    combined_rating: 7.25
  },
  {
    name: "GMO (Garlic Cookies)",
    overview: "Indica-dominant hybrid with a pungent garlic aroma and deeply relaxing effects.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Chemdawg x GSC",
    thc_range: "18-25%",
    cbd_level: "Low",
    dominant_terpenes: "Caryophyllene, Myrcene",
    qualitative_insights: "Pungent, savory aroma with earthy undertones; sticky buds",
    effects: "Relaxed, Sedated, Euphoric",
    negatives: "dry mouth, dry eyes",
    uses: "Ideal for pain relief and stress reduction",
    thc_rating: 8.25,
    user_rating: 8,
    combined_rating: 8.13
  },
  {
    name: "Do-Si-Dos",
    overview: "Indica-dominant hybrid offering a sweet and earthy flavor with potent relaxing effects.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Girl Scout Cookies x Face Off OG",
    thc_range: "18-22%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Sweet, floral aroma with hints of mint; dense, resinous buds",
    effects: "Relaxed, Euphoric, Sedated",
    negatives: "dry mouth, drowsiness",
    uses: "Used for anxiety relief and relaxation",
    thc_rating: 7.5,
    user_rating: 7,
    combined_rating: 7.25
  },
  {
    name: "Runtz",
    overview: "Balanced hybrid known for its sweet, candy-like flavor and powerful, euphoric high.",
    genetic_type: "Hybrid",
    lineage: "Zkittlez x Gelato",
    thc_range: "19-29%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Fruity, candy-like aroma; vibrant, colorful buds",
    effects: "Happy, Euphoric, Relaxed",
    negatives: "dry mouth, dizziness",
    uses: "Ideal for creative pursuits and mood enhancement",
    thc_rating: 9.5,
    user_rating: 9,
    combined_rating: 9.25
  },
  {
    name: "Zkittlez",
    overview: "Indica-dominant hybrid with a sweet, fruity flavor and a relaxing, mellow high.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Grape Ape x Grapefruit",
    thc_range: "15-22%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Limonene",
    qualitative_insights: "Intensely sweet, fruity aroma; compact, resinous buds",
    effects: "Relaxed, Happy, Euphoric",
    negatives: "dry mouth, dry eyes",
    uses: "Great for stress relief and relaxation",
    thc_rating: 6.75,
    user_rating: 6.5,
    combined_rating: 6.63
  },
  {
    name: "Biscotti",
    overview: "Hybrid strain offering a rich, cookie-like flavor paired with a balanced high.",
    genetic_type: "Hybrid",
    lineage: "Girl Scout Cookies x South Florida OG",
    thc_range: "18-25%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Sweet, baked aroma with hints of spice; dense, trichome-rich buds",
    effects: "Happy, Relaxed, Uplifted",
    negatives: "dry mouth, drowsiness",
    uses: "Suitable for creative tasks and relaxation",
    thc_rating: 8.25,
    user_rating: 8,
    combined_rating: 8.13
  },
  {
    name: "Tahoe OG",
    overview: "Indica-dominant strain with a robust, earthy pine flavor and potent body effects.",
    genetic_type: "Indica-dominant",
    lineage: "OG Kush lineage",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Limonene",
    qualitative_insights: "Earthy, pine aroma with a hint of spice; compact, sticky buds",
    effects: "Relaxed, Sedated, Euphoric",
    negatives: "dry mouth, couch-lock",
    uses: "Ideal for pain relief and stress management",
    thc_rating: 8.75,
    user_rating: 8.5,
    combined_rating: 8.63
  },
  {
    name: "Forbidden Fruit",
    overview: "Hybrid strain known for its tropical, fruity flavor and deeply relaxing high.",
    genetic_type: "Hybrid",
    lineage: "Tangie x Cherry Pie",
    thc_range: "18-23%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Tropical, citrusy aroma with sweet undertones; resinous buds",
    effects: "Relaxed, Happy, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Great for evening relaxation and mood enhancement",
    thc_rating: 7.75,
    user_rating: 7.5,
    combined_rating: 7.63
  },
  {
    name: "Agent Orange",
    overview: "Sativa-dominant hybrid offering a zesty citrus flavor and uplifting effects.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Orange Velvet x Jack the Ripper",
    thc_range: "18-25%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Terpinolene",
    qualitative_insights: "Vibrant citrus aroma with sweet, tangy notes; frosty buds",
    effects: "Energized, Uplifted, Creative",
    negatives: "dry mouth, dry eyes",
    uses: "Ideal for daytime use and creative inspiration",
    thc_rating: 8.25,
    user_rating: 8,
    combined_rating: 8.13
  },
  {
    name: "Sour Tangie",
    overview: "Sativa-dominant hybrid blending sour diesel with tangy citrus flavors for a vibrant high.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Sour Diesel x Tangie",
    thc_range: "18-24%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Tangy citrus aroma with a hint of sour diesel; dense buds",
    effects: "Energized, Uplifted, Focused",
    negatives: "dry mouth, anxiety",
    uses: "Suitable for creative projects and daytime activities",
    thc_rating: 8,
    user_rating: 7.75,
    combined_rating: 7.88
  },
  {
    name: "Critical Kush",
    overview: "Indica-dominant hybrid merging heavy yields with a potent, relaxing high.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Critical Mass x OG Kush",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Earthy, pine aroma with subtle sweetness; chunky buds",
    effects: "Relaxed, Sedated, Happy",
    negatives: "dry mouth, drowsiness",
    uses: "Great for pain relief and evening relaxation",
    thc_rating: 8.75,
    user_rating: 8.25,
    combined_rating: 8.50
  },
  {
    name: "Alaskan Thunder Fuck",
    overview: "Sativa-dominant hybrid known for its strong, uplifting high and pungent, piney aroma.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Afghani x Unknown",
    thc_range: "18-25%",
    cbd_level: "Low",
    dominant_terpenes: "Pinene, Myrcene",
    qualitative_insights: "Pungent, piney scent with earthy undertones; frosty, energizing buds",
    effects: "Energized, Uplifted, Creative",
    negatives: "dry mouth, anxiety",
    uses: "Ideal for boosting energy and focus",
    thc_rating: 8.25,
    user_rating: 8,
    combined_rating: 8.13
  },
  {
    name: "Harlequin",
    overview: "CBD-rich sativa-dominant strain celebrated for its clear-headed, medicinal effects.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Colombian Gold x Nepalese",
    thc_range: "7-15%",
    cbd_level: "High",
    dominant_terpenes: "Myrcene, Pinene",
    qualitative_insights: "Earthy, herbal aroma with subtle sweetness; lighter buds",
    effects: "Clear-headed, Relaxed, Focused",
    negatives: "dry mouth, dizziness",
    uses: "Used for pain relief and anxiety management",
    thc_rating: 3,
    user_rating: 3.5,
    combined_rating: 3.25
  },
  {
    name: "Cannatonic",
    overview: "Balanced hybrid renowned for its low THC and high CBD content, offering gentle relief.",
    genetic_type: "Hybrid",
    lineage: "MK Ultra x G13",
    thc_range: "6-17%",
    cbd_level: "High",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Earthy and citrus aroma; soft, resinous buds",
    effects: "Calm, Relaxed, Focused",
    negatives: "dry mouth, fatigue",
    uses: "Ideal for medical use and anxiety relief",
    thc_rating: 3.25,
    user_rating: 3.5,
    combined_rating: 3.38
  },
  {
    name: "Charlotte's Web",
    overview: "CBD-dominant strain with minimal psychoactive effects, designed for therapeutic use.",
    genetic_type: "CBD-dominant",
    lineage: "High CBD phenotype of hemp",
    thc_range: "0-0.3%",
    cbd_level: "Very High",
    dominant_terpenes: "Myrcene, Limonene",
    qualitative_insights: "Mild, herbal aroma; less resinous buds",
    effects: "Calm, Focused, Clear-headed",
    negatives: "none",
    uses: "Used for epilepsy and chronic pain management",
    thc_rating: 0.5,
    user_rating: 0.5,
    combined_rating: 0.5
  },
  {
    name: "Remedy",
    overview: "Balanced hybrid with high CBD content offering mild relaxation without strong psychoactive effects.",
    genetic_type: "Hybrid",
    lineage: "CBD-rich phenotype",
    thc_range: "1-4%",
    cbd_level: "High",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Earthy, citrus notes; soft buds",
    effects: "Relaxed, Clear-headed, Calm",
    negatives: "dry mouth, sedation",
    uses: "Ideal for anxiety and pain relief",
    thc_rating: 3.5,
    user_rating: 3.75,
    combined_rating: 3.63
  },
  {
    name: "Pennywise",
    overview: "Indica-dominant strain with a near 1:1 THC to CBD ratio, offering balanced effects.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Harle-Tsu x Jack the Ripper",
    thc_range: "4-8%",
    cbd_level: "Balanced",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Earthy aroma with subtle spice; compact buds",
    effects: "Calm, Focused, Euphoric",
    negatives: "dry mouth, dizziness",
    uses: "Suitable for medical use and stress relief",
    thc_rating: 3.5,
    user_rating: 3.75,
    combined_rating: 3.63
  },
  {
    name: "Canna-Tsu",
    overview: "Hybrid strain featuring balanced levels of THC and CBD for a mild, uplifting experience.",
    genetic_type: "Hybrid",
    lineage: "Cannatonic x Sour Tsunami",
    thc_range: "4-8%",
    cbd_level: "Balanced",
    dominant_terpenes: "Limonene, Pinene",
    qualitative_insights: "Subtle citrus aroma with herbal notes; light buds",
    effects: "Calm, Happy, Clear-headed",
    negatives: "dry mouth, fatigue",
    uses: "Used for mild pain and anxiety relief",
    thc_rating: 3.5,
    user_rating: 3.75,
    combined_rating: 3.63
  },
  {
    name: "ACDC",
    overview: "CBD-dominant strain with minimal psychoactive effects, prized for its therapeutic benefits.",
    genetic_type: "CBD-dominant",
    lineage: "Cannatonic phenotype",
    thc_range: "1-6%",
    cbd_level: "Very High",
    dominant_terpenes: "Myrcene, Limonene",
    qualitative_insights: "Earthy, herbal aroma; non-resinous buds",
    effects: "Clear-headed, Relaxed, Focused",
    negatives: "none",
    uses: "Ideal for chronic pain, inflammation, anxiety",
    thc_rating: 1.5,
    user_rating: 1.75,
    combined_rating: 1.63
  },
  {
    name: "Ringo's Gift",
    overview: "Hybrid strain with high CBD offering a balanced and clear-headed experience.",
    genetic_type: "Hybrid",
    lineage: "Harle-Tsu x ACDC",
    thc_range: "Varies (1:1–24:1 ratio)",
    cbd_level: "High",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Mild, earthy aroma with sweet undertones; moderate buds",
    effects: "Calm, Focused, Relaxed",
    negatives: "dry mouth, sedation",
    uses: "Used for pain, anxiety, seizure management",
    thc_rating: 2,
    user_rating: 2.25,
    combined_rating: 2.13
  },
  {
    name: "Sour Tsunami",
    overview: "CBD-dominant strain known for its low THC content and effective pain relief properties.",
    genetic_type: "CBD-dominant",
    lineage: "Sour Diesel phenotype",
    thc_range: "6-10%",
    cbd_level: "High",
    dominant_terpenes: "Limonene, Myrcene",
    qualitative_insights: "Tangy, diesel aroma with earthy notes; less resinous",
    effects: "Calm, Relaxed, Focused",
    negatives: "dry mouth, sedation",
    uses: "Ideal for chronic pain and inflammation",
    thc_rating: 1.5,
    user_rating: 1.75,
    combined_rating: 1.63
  },
  {
    name: "Harle-Tsu",
    overview: "Balanced CBD-rich hybrid offering mild euphoria with significant therapeutic benefits.",
    genetic_type: "Hybrid",
    lineage: "Harlequin x Canna-Tsu",
    thc_range: "4-10%",
    cbd_level: "High",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Earthy, herbal scent with subtle citrus; light buds",
    effects: "Clear-headed, Calm, Relaxed",
    negatives: "dry mouth, fatigue",
    uses: "Used for anxiety and pain relief",
    thc_rating: 2,
    user_rating: 2.25,
    combined_rating: 2.13
  },
  {
    name: "Blue Cheese",
    overview: "Indica-dominant hybrid with a pungent, cheese-like aroma and deeply relaxing effects.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Blueberry x UK Cheese",
    thc_range: "18-22%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Strong cheesy aroma with sweet berry undertones; dense buds",
    effects: "Relaxed, Euphoric, Sedated",
    negatives: "dry mouth, drowsiness",
    uses: "Great for stress relief and relaxation",
    thc_rating: 7.5,
    user_rating: 7.25,
    combined_rating: 7.38
  },
  {
    name: "Orange Bud",
    overview: "Sativa-dominant strain celebrated for its vibrant citrus flavor and uplifting effects.",
    genetic_type: "Sativa-dominant",
    lineage: "Afghani x Thai",
    thc_range: "15-22%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Terpinolene",
    qualitative_insights: "Bright citrus aroma with a hint of spice; light, airy buds",
    effects: "Energetic, Uplifted, Happy",
    negatives: "dry mouth, dry eyes",
    uses: "Ideal for daytime use and mood elevation",
    thc_rating: 6.75,
    user_rating: 6.5,
    combined_rating: 6.63
  },
  {
    name: "LA Confidential",
    overview: "Indica-dominant strain known for its smooth, pine and spice flavors and calming effects.",
    genetic_type: "Indica-dominant",
    lineage: "Afghani x OG Kush",
    thc_range: "16-22%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Limonene",
    qualitative_insights: "Earthy, pine aroma with subtle sweetness; resinous buds",
    effects: "Relaxed, Sedated, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Used for stress relief and insomnia",
    thc_rating: 7,
    user_rating: 7,
    combined_rating: 7.00
  },
  {
    name: "God's Gift",
    overview: "Indica-dominant hybrid offering a powerful, euphoric high with a sweet, grape aroma.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Granddaddy Purple x OG Kush",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Rich, sweet grape aroma with sticky, dense buds",
    effects: "Relaxed, Euphoric, Sedated",
    negatives: "dry mouth, couch-lock",
    uses: "Ideal for pain relief and stress management",
    thc_rating: 8.75,
    user_rating: 8.5,
    combined_rating: 8.63
  },
  {
    name: "NYC Diesel",
    overview: "Sativa-dominant strain with a strong diesel aroma and uplifting, creative effects.",
    genetic_type: "Sativa-dominant",
    lineage: "Diesel x Unknown",
    thc_range: "18-25%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Pungent diesel scent with hints of citrus; frosty buds",
    effects: "Energized, Creative, Uplifted",
    negatives: "dry mouth, anxiety",
    uses: "Great for daytime creativity and focus",
    thc_rating: 8.25,
    user_rating: 8,
    combined_rating: 8.13
  },
  {
    name: "Skunk #1",
    overview: "Classic hybrid known for its strong, skunky aroma and balanced, long-lasting effects.",
    genetic_type: "Hybrid",
    lineage: "Skunk #1 lineage",
    thc_range: "15-20%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Pungent, skunky odor with earthy undertones; sticky buds",
    effects: "Happy, Relaxed, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for stress relief and mood elevation",
    thc_rating: 6.25,
    user_rating: 6,
    combined_rating: 6.13
  },
  {
    name: "Lemon Skunk",
    overview: "Hybrid strain offering a zesty lemon flavor and an energetic, uplifting high.",
    genetic_type: "Hybrid",
    lineage: "Skunk x Lemon Thai",
    thc_range: "15-22%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Terpinolene",
    qualitative_insights: "Bright lemon aroma with skunky undertones; light buds",
    effects: "Energized, Uplifted, Happy",
    negatives: "dry mouth, anxiety",
    uses: "Great for daytime use and creative tasks",
    thc_rating: 6.75,
    user_rating: 6.5,
    combined_rating: 6.63
  },
  {
    name: "Master Kush",
    overview: "Indica-dominant strain renowned for its earthy, spicy flavor and deeply calming effects.",
    genetic_type: "Indica-dominant",
    lineage: "Afghani lineage",
    thc_range: "15-22%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Limonene",
    qualitative_insights: "Earthy, herbal aroma with a subtle spice; dense buds",
    effects: "Relaxed, Sedated, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for stress relief and pain management",
    thc_rating: 6.75,
    user_rating: 6.5,
    combined_rating: 6.63
  },
  {
    name: "Hindu Kush",
    overview: "Pure indica known for its earthy, woody flavors and deeply relaxing effects.",
    genetic_type: "Indica (Pure)",
    lineage: "Hindu Kush Landrace",
    thc_range: "16-21%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Pinene",
    qualitative_insights: "Earthy, woody aroma with a hint of spice; compact buds",
    effects: "Calm, Relaxed, Sedated",
    negatives: "dry mouth, couch-lock",
    uses: "Used for relaxation and pain relief",
    thc_rating: 6.75,
    user_rating: 6.5,
    combined_rating: 6.63
  },
  {
    name: "Afghani",
    overview: "Pure indica landrace with a strong, earthy aroma and heavy, sedative effects.",
    genetic_type: "Indica (Pure)",
    lineage: "Afghani Landrace",
    thc_range: "18-23%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Earthy, hash-like aroma; resinous, dense buds",
    effects: "Relaxed, Sedated, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for pain relief and insomnia",
    thc_rating: 7.5,
    user_rating: 7.25,
    combined_rating: 7.38
  },
  {
    name: "Pakistani Chitral Kush",
    overview: "Robust pure indica with a distinct earthy and spicy flavor profile and potent effects.",
    genetic_type: "Indica (Pure)",
    lineage: "Pakistani Landrace",
    thc_range: "18-25%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Pinene",
    qualitative_insights: "Earthy, spicy aroma with resinous buds",
    effects: "Relaxed, Sedated, Euphoric",
    negatives: "dry mouth, couch-lock",
    uses: "Used for chronic pain and insomnia",
    thc_rating: 8.25,
    user_rating: 8,
    combined_rating: 8.13
  },
  {
    name: "Blueberry Kush",
    overview: "Hybrid strain combining fruity blueberry flavors with classic Kush earthiness.",
    genetic_type: "Hybrid",
    lineage: "Blueberry x Kush",
    thc_range: "18-24%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Sweet blueberry aroma with earthy, herbal notes; dense buds",
    effects: "Relaxed, Happy, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for stress relief and mood enhancement",
    thc_rating: 8,
    user_rating: 7.75,
    combined_rating: 7.88
  },
  {
    name: "Cherry OG",
    overview: "Hybrid strain known for its sweet cherry flavor and potent, balanced high.",
    genetic_type: "Hybrid",
    lineage: "Cherry Pie x OG Kush",
    thc_range: "20-26%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Sweet cherry aroma with earthy undertones; sticky buds",
    effects: "Relaxed, Euphoric, Creative",
    negatives: "dry mouth, dry eyes",
    uses: "Used for stress relief and pain management",
    thc_rating: 9,
    user_rating: 8.75,
    combined_rating: 8.88
  },
  {
    name: "Jack Flash",
    overview: "Indica-dominant hybrid delivering a potent, sedative high with a spicy, herbal flavor.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Jack the Ripper x Flashback",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Herbal, spicy aroma with a hint of citrus; dense buds",
    effects: "Relaxed, Sedated, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for nighttime use and pain relief",
    thc_rating: 8.75,
    user_rating: 8.5,
    combined_rating: 8.63
  },
  {
    name: "White Rhino",
    overview: "Indica-dominant strain known for its heavy, resinous buds and powerful body high.",
    genetic_type: "Indica-dominant",
    lineage: "Afghani x Unknown",
    thc_range: "18-22%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Earthy, pine aroma with a hint of sweetness; chunky buds",
    effects: "Relaxed, Sedated, Euphoric",
    negatives: "dry mouth, couch-lock",
    uses: "Used for severe pain and stress relief",
    thc_rating: 7.5,
    user_rating: 7.25,
    combined_rating: 7.38
  },
  {
    name: "Alien OG",
    overview: "Hybrid strain celebrated for its potent, spacey high and complex pine-citrus flavors.",
    genetic_type: "Hybrid",
    lineage: "Tahoe OG x Alien Kush",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Myrcene",
    qualitative_insights: "Pine and citrus aroma with a touch of earthiness; frosty buds",
    effects: "Euphoric, Creative, Relaxed",
    negatives: "dry mouth, dry eyes",
    uses: "Ideal for creative sessions and relaxation",
    thc_rating: 8.75,
    user_rating: 8.5,
    combined_rating: 8.63
  },
  {
    name: "Critical Jack",
    overview: "Hybrid that merges the uplifting effects of Jack Herer with the heavy yields of Critical Mass.",
    genetic_type: "Hybrid",
    lineage: "Jack Herer x Critical Mass",
    thc_range: "18-25%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Balanced aroma with hints of spice and earth; robust buds",
    effects: "Happy, Relaxed, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Great for stress relief and creative inspiration",
    thc_rating: 8.25,
    user_rating: 8,
    combined_rating: 8.13
  },
  {
    name: "Agent Diesel",
    overview: "Hybrid strain with a robust diesel aroma and a balanced, energizing high.",
    genetic_type: "Hybrid",
    lineage: "Diesel x Unknown",
    thc_range: "18-24%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Strong diesel scent with citrus hints; resinous buds",
    effects: "Energized, Uplifted, Focused",
    negatives: "dry mouth, anxiety",
    uses: "Ideal for daytime focus and creativity",
    thc_rating: 8,
    user_rating: 7.75,
    combined_rating: 7.88
  },
  {
    name: "Candyland",
    overview: "Sativa-dominant hybrid offering a sweet, candy-like flavor with an uplifting high.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Unknown (landrace blend)",
    thc_range: "16-22%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Myrcene",
    qualitative_insights: "Sweet, sugary aroma; light, airy buds",
    effects: "Happy, Euphoric, Energetic",
    negatives: "dry mouth, dry eyes",
    uses: "Suitable for daytime energy and creativity",
    thc_rating: 7,
    user_rating: 7,
    combined_rating: 7.00
  },
  {
    name: "Tangie",
    overview: "Sativa-dominant strain famous for its strong citrus aroma and euphoric, uplifting effects.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Grapefruit x California Orange",
    thc_range: "18-25%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Terpinolene",
    qualitative_insights: "Vibrant citrus scent with sweet undertones; frosty buds",
    effects: "Uplifted, Energetic, Creative",
    negatives: "dry mouth, anxiety",
    uses: "Perfect for boosting mood and creativity",
    thc_rating: 8.25,
    user_rating: 8,
    combined_rating: 8.13
  },
  {
    name: "Chernobyl",
    overview: "Hybrid strain with an earthy, pungent aroma and a balanced mix of cerebral and body effects.",
    genetic_type: "Hybrid",
    lineage: "Unknown (landrace blend)",
    thc_range: "16-20%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Earthy, spicy aroma; compact, dense buds",
    effects: "Balanced, Euphoric, Relaxed",
    negatives: "dry mouth, dry eyes",
    uses: "Ideal for daytime use and mild pain relief",
    thc_rating: 6.5,
    user_rating: 6.25,
    combined_rating: 6.38
  },
  {
    name: "LSD",
    overview: "Sativa-dominant hybrid renowned for its psychedelic, mind-bending high and complex flavor profile.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Unknown (Haze lineage)",
    thc_range: "18-25%",
    cbd_level: "Low",
    dominant_terpenes: "Terpinolene, Myrcene",
    qualitative_insights: "Psychedelic, earthy aroma with hints of citrus; trichome-rich buds",
    effects: "Creative, Euphoric, Uplifted",
    negatives: "dry mouth, paranoia",
    uses: "Great for creative exploration and social settings",
    thc_rating: 8.25,
    user_rating: 8,
    combined_rating: 8.13
  },
  {
    name: "Romulan",
    overview: "Indica-dominant strain delivering a potent, sedative high with an earthy, pine flavor.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Indica landrace",
    thc_range: "20-26%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Earthy, pine aroma with spicy undertones; dense buds",
    effects: "Relaxed, Sedated, Euphoric",
    negatives: "dry mouth, couch-lock",
    uses: "Ideal for evening use and pain management",
    thc_rating: 9,
    user_rating: 8.75,
    combined_rating: 8.88
  },
  {
    name: "Berry White",
    overview: "Hybrid strain offering a sweet berry flavor with a balanced, uplifting high.",
    genetic_type: "Hybrid",
    lineage: "Unknown (landrace blend)",
    thc_range: "15-21%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Sweet berry aroma with subtle earthy notes; light buds",
    effects: "Happy, Euphoric, Relaxed",
    negatives: "dry mouth, dry eyes",
    uses: "Great for mood elevation and relaxation",
    thc_rating: 6.5,
    user_rating: 6.25,
    combined_rating: 6.38
  },
  {
    name: "Blackberry Kush",
    overview: "Indica-dominant hybrid known for its rich, blackberry flavor and calming effects.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Unknown (Kush lineage)",
    thc_range: "18-25%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Limonene",
    qualitative_insights: "Sweet, berry aroma with earthy, herbal notes; compact buds",
    effects: "Relaxed, Sedated, Happy",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for stress relief and insomnia",
    thc_rating: 8.25,
    user_rating: 8,
    combined_rating: 8.13
  },
  {
    name: "Forbidden Berry",
    overview: "Hybrid strain combining sweet berry flavors with a potent, relaxing high.",
    genetic_type: "Hybrid",
    lineage: "Forbidden Fruit x Blackberry Kush",
    thc_range: "18-24%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Fruity, berry aroma with earthy undertones; resinous buds",
    effects: "Relaxed, Euphoric, Happy",
    negatives: "dry mouth, dry eyes",
    uses: "Suitable for evening relaxation and mood enhancement",
    thc_rating: 8,
    user_rating: 7.75,
    combined_rating: 7.88
  },
  {
    name: "Sour OG",
    overview: "Hybrid strain featuring a sour, pungent aroma with powerful, sedative effects.",
    genetic_type: "Hybrid",
    lineage: "OG Kush x Sour Diesel",
    thc_range: "20-26%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Sour, pungent aroma with earthy undertones; sticky buds",
    effects: "Relaxed, Sedated, Euphoric",
    negatives: "dry mouth, couch-lock",
    uses: "Great for pain relief and heavy relaxation",
    thc_rating: 9,
    user_rating: 8.5,
    combined_rating: 8.75
  },
  {
    name: "God Bud",
    overview: "Indica-dominant strain revered for its heavy, sedative high and earthy, herbal flavor.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Unknown (classic strain)",
    thc_range: "15-22%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Earthy, herbal aroma with a subtle sweetness; dense buds",
    effects: "Relaxed, Sedated, Happy",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for chronic pain and insomnia",
    thc_rating: 6.75,
    user_rating: 6.5,
    combined_rating: 6.63
  },
  {
    name: "Cheese",
    overview: "Indica-dominant hybrid noted for its pungent, cheesy aroma and balanced, relaxing effects.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "UK Cheese Landrace",
    thc_range: "18-22%",
    cbd_level: "Low",
    dominant_terpenes: "Caryophyllene, Myrcene",
    qualitative_insights: "Strong cheesy odor with earthy undertones; dense, sticky buds",
    effects: "Relaxed, Euphoric, Happy",
    negatives: "dry mouth, dry eyes",
    uses: "Perfect for stress relief and creative pursuits",
    thc_rating: 7.5,
    user_rating: 7.25,
    combined_rating: 7.38
  },
  {
    name: "G13",
    overview: "Potent hybrid with a mysterious lineage offering a powerful, euphoric high.",
    genetic_type: "Hybrid",
    lineage: "Urban legend strain",
    thc_range: "20-26%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Pungent, earthy aroma with hints of diesel; compact buds",
    effects: "Euphoric, Creative, Relaxed",
    negatives: "dry mouth, dizziness",
    uses: "Ideal for experienced users seeking strong effects",
    thc_rating: 9,
    user_rating: 8.75,
    combined_rating: 8.88
  },
  {
    name: "Blueberry OG",
    overview: "Hybrid strain merging the sweet flavors of Blueberry with the potency of OG Kush.",
    genetic_type: "Hybrid",
    lineage: "Blueberry x OG Kush",
    thc_range: "18-25%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Sweet blueberry aroma with earthy, pine undertones; resinous buds",
    effects: "Relaxed, Euphoric, Happy",
    negatives: "dry mouth, drowsiness",
    uses: "Great for relaxation and mood enhancement",
    thc_rating: 8.25,
    user_rating: 8,
    combined_rating: 8.13
  },
  {
    name: "Cherry Bomb",
    overview: "Hybrid strain with an explosive cherry flavor and a dynamic, balanced high.",
    genetic_type: "Hybrid",
    lineage: "Cherry Pie x Unknown",
    thc_range: "18-24%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Bold cherry aroma with a hint of spice; dense buds",
    effects: "Euphoric, Energetic, Creative",
    negatives: "dry mouth, dry eyes",
    uses: "Ideal for creative pursuits and social gatherings",
    thc_rating: 8,
    user_rating: 8,
    combined_rating: 8.00
  },
  {
    name: "Mango Kush",
    overview: "Indica-dominant hybrid offering a tropical mango flavor with deeply relaxing effects.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Afghani x Mango",
    thc_range: "20-26%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Limonene",
    qualitative_insights: "Tropical mango aroma with earthy undertones; dense, resinous buds",
    effects: "Relaxed, Sedated, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Used for stress relief and relaxation",
    thc_rating: 9,
    user_rating: 8.75,
    combined_rating: 8.88
  },
  {
    name: "Pineapple Chunk",
    overview: "Indica-dominant hybrid featuring a sweet pineapple aroma and a heavy, sedative high.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Pineapple x Chunk",
    thc_range: "16-23%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Myrcene",
    qualitative_insights: "Tropical pineapple scent with earthy notes; chunky buds",
    effects: "Relaxed, Sedated, Happy",
    negatives: "dry mouth, couch-lock",
    uses: "Ideal for evening use and pain management",
    thc_rating: 7.25,
    user_rating: 7,
    combined_rating: 7.13
  },
  {
    name: "Jillybean",
    overview: "Hybrid strain known for its fruity, floral flavor and uplifting, creative effects.",
    genetic_type: "Hybrid",
    lineage: "Unknown (landrace blend)",
    thc_range: "15-20%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Fruity, floral aroma with a sweet finish; light buds",
    effects: "Uplifted, Euphoric, Creative",
    negatives: "dry mouth, dry eyes",
    uses: "Great for daytime use and creative inspiration",
    thc_rating: 6.25,
    user_rating: 6,
    combined_rating: 6.13
  },
  {
    name: "Strawberry Banana",
    overview: "Hybrid strain combining sweet strawberry and banana flavors with a balanced high.",
    genetic_type: "Hybrid",
    lineage: "Unknown (blend)",
    thc_range: "18-26%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Myrcene",
    qualitative_insights: "Sweet, tropical aroma with a creamy finish; resinous buds",
    effects: "Happy, Relaxed, Euphoric",
    negatives: "dry mouth, dizziness",
    uses: "Ideal for mood elevation and relaxation",
    thc_rating: 8.5,
    user_rating: 8.25,
    combined_rating: 8.38
  },
  {
    name: "Tropicana Cookies",
    overview: "Sativa-dominant hybrid delivering a burst of citrus and cookie flavors with an energetic high.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Cookie genetics x Tangie",
    thc_range: "20-28%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Zesty citrus aroma with a sweet, baked undertone; frosty buds",
    effects: "Energized, Uplifted, Creative",
    negatives: "dry mouth, dry eyes",
    uses: "Perfect for daytime creativity and social events",
    thc_rating: 9.5,
    user_rating: 9,
    combined_rating: 9.25
  },
  {
    name: "UK Cheese",
    overview: "Indica-dominant variant of Cheese known for its pungent aroma and relaxing, euphoric effects.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "UK Landrace",
    thc_range: "15-20%",
    cbd_level: "Low",
    dominant_terpenes: "Caryophyllene, Myrcene",
    qualitative_insights: "Strong cheesy odor with herbal undertones; sticky buds",
    effects: "Relaxed, Euphoric, Happy",
    negatives: "dry mouth, dry eyes",
    uses: "Great for stress relief and relaxation",
    thc_rating: 6.25,
    user_rating: 6,
    combined_rating: 6.13
  },
  {
    name: "Raspberry Kush",
    overview: "Indica-dominant hybrid with a sweet raspberry flavor and a deeply calming high.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Afghani x Unknown",
    thc_range: "18-24%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Sweet raspberry aroma with earthy notes; dense buds",
    effects: "Relaxed, Sedated, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for evening use and pain relief",
    thc_rating: 8,
    user_rating: 7.75,
    combined_rating: 7.88
  },
  {
    name: "Orange Cookies",
    overview: "Hybrid strain combining citrus and sweet cookie flavors with a balanced, uplifting high.",
    genetic_type: "Hybrid",
    lineage: "Girl Scout Cookies x Orange Velvet",
    thc_range: "18-25%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Citrus-infused aroma with sweet undertones; resinous buds",
    effects: "Happy, Relaxed, Uplifted",
    negatives: "dry mouth, dry eyes",
    uses: "Suitable for mood enhancement and stress relief",
    thc_rating: 8.25,
    user_rating: 8,
    combined_rating: 8.13
  },
  {
    name: "White Tahoe Cookies",
    overview: "Indica-dominant hybrid featuring a sweet, citrusy flavor and potent, relaxing effects.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "Tahoe OG x Cookies",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Sweet citrus aroma with earthy hints; dense, sticky buds",
    effects: "Relaxed, Euphoric, Sedated",
    negatives: "dry mouth, couch-lock",
    uses: "Ideal for evening relaxation and pain management",
    thc_rating: 8.75,
    user_rating: 8.5,
    combined_rating: 8.63
  },
  {
    name: "Fire OG",
    overview: "Indica-dominant strain known for its intense, spicy pine flavor and powerful sedative effects.",
    genetic_type: "Indica-dominant Hybrid",
    lineage: "OG Kush lineage",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Limonene",
    qualitative_insights: "Spicy, pine aroma with a hint of earthiness; chunky buds",
    effects: "Relaxed, Sedated, Euphoric",
    negatives: "dry mouth, drowsiness",
    uses: "Used for severe pain relief and stress reduction",
    thc_rating: 8.75,
    user_rating: 8.5,
    combined_rating: 8.63
  },
  {
    name: "Headband",
    overview: "Hybrid strain recognized for its tight, band-like effect and a balanced cerebral and body high.",
    genetic_type: "Hybrid",
    lineage: "Super Silver Haze x OG Kush",
    thc_range: "18-22%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Subtle, earthy aroma with hints of diesel; compact buds",
    effects: "Euphoric, Relaxed, Focused",
    negatives: "dry mouth, fatigue",
    uses: "Great for migraine relief and creative focus",
    thc_rating: 7.5,
    user_rating: 7.25,
    combined_rating: 7.38
  },
  {
    name: "Jack the Ripper",
    overview: "Potent hybrid with a sharp, spicy flavor and a fast-acting, cerebral high.",
    genetic_type: "Hybrid",
    lineage: "Jack Herer x Unknown",
    thc_range: "18-24%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Spicy, herbal aroma with a hint of citrus; dense buds",
    effects: "Euphoric, Creative, Energetic",
    negatives: "dry mouth, dry eyes",
    uses: "Ideal for creative inspiration and stress relief",
    thc_rating: 8,
    user_rating: 8,
    combined_rating: 8.00
  },
  {
    name: "Cinderella 99",
    overview: "Sativa-dominant hybrid known for its uplifting, energetic high and sweet, citrus flavor.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Unknown (landrace blend)",
    thc_range: "18-24%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Terpinolene",
    qualitative_insights: "Sweet citrus aroma with floral hints; airy buds",
    effects: "Energized, Uplifted, Creative",
    negatives: "dry mouth, anxiety",
    uses: "Great for daytime energy and creativity",
    thc_rating: 8,
    user_rating: 8.25,
    combined_rating: 8.13
  },
  {
    name: "Blue Cookies",
    overview: "Hybrid strain combining sweet blueberry flavors with a calming, balanced high.",
    genetic_type: "Hybrid",
    lineage: "Blueberry x Girl Scout Cookies",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Caryophyllene",
    qualitative_insights: "Sweet blueberry aroma with earthy undertones; resinous buds",
    effects: "Relaxed, Euphoric, Happy",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for relaxation and mood enhancement",
    thc_rating: 8.75,
    user_rating: 8.5,
    combined_rating: 8.63
  },
  {
    name: "Mimosa",
    overview: "Sativa-dominant hybrid offering a vibrant citrus and sweet, tangy flavor with an uplifting high.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Citrus x Purple Punch",
    thc_range: "20-25%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Bright citrus aroma with sweet, fruity notes; light buds",
    effects: "Energized, Uplifted, Happy",
    negatives: "dry mouth, dry eyes",
    uses: "Perfect for daytime use and social gatherings",
    thc_rating: 8.75,
    user_rating: 8.5,
    combined_rating: 8.63
  },
  {
    name: "LA Kush",
    overview: "Hybrid strain known for its spicy, earthy flavor and balanced, calming effects.",
    genetic_type: "Hybrid",
    lineage: "LA x Kush lineage",
    thc_range: "17-22%",
    cbd_level: "Low",
    dominant_terpenes: "Myrcene, Limonene",
    qualitative_insights: "Earthy, spicy aroma with subtle floral hints; moderate buds",
    effects: "Relaxed, Euphoric, Focused",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for stress relief and relaxation",
    thc_rating: 7.25,
    user_rating: 7,
    combined_rating: 7.13
  },
  {
    name: "Amnesia Lemon",
    overview: "Sativa-dominant hybrid blending citrus and earthy flavors for an energizing, creative high.",
    genetic_type: "Sativa-dominant Hybrid",
    lineage: "Amnesia x Lemon Skunk",
    thc_range: "18-24%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Terpinolene",
    qualitative_insights: "Bright lemon aroma with earthy undertones; light, airy buds",
    effects: "Energized, Uplifted, Creative",
    negatives: "dry mouth, anxiety",
    uses: "Great for daytime creativity and mood boost",
    thc_rating: 8,
    user_rating: 8,
    combined_rating: 8.00
  },
  {
    name: "Forbidden Jack",
    overview: "Hybrid strain merging tropical fruit notes with a potent, balanced high for a unique experience.",
    genetic_type: "Hybrid",
    lineage: "Forbidden Fruit x Jack Herer",
    thc_range: "19-25%",
    cbd_level: "Low",
    dominant_terpenes: "Limonene, Caryophyllene",
    qualitative_insights: "Tropical, fruity aroma with spicy hints; resinous buds",
    effects: "Euphoric, Relaxed, Creative",
    negatives: "dry mouth, drowsiness",
    uses: "Ideal for creative sessions and stress relief",
    thc_rating: 8.5,
    user_rating: 8.25,
    combined_rating: 8.38
  }
];