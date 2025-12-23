module.exports = {
    // --- Canonical / direct ---
    "UTC": "UTC",
    "ETC/UTC": "UTC",
    "GMT": "Etc/GMT",
    "UNIVERSAL": "UTC",
    "GREENWICH": "Etc/GMT",

    // --- US / Canada (common) ---
    "ET": "America/New_York",
    "EASTERN": "America/New_York",
    "EST": "America/New_York",
    "EDT": "America/New_York",

    "CT": "America/Chicago",
    "CENTRAL": "America/Chicago",
    "CST": "America/Chicago", // ambiguous globally ('MERICA BABY)
    "CDT": "America/Chicago",

    "MT": "America/Denver",
    "MOUNTAIN": "America/Denver",
    "MST": "America/Denver",
    "MDT": "America/Denver",

    "PT": "America/Los_Angeles",
    "PACIFIC": "America/Los_Angeles",
    "PST": "America/Los_Angeles",
    "PDT": "America/Los_Angeles",

    "AKT": "America/Anchorage",
    "ALASKA": "America/Anchorage",
    "AKST": "America/Anchorage",
    "AKDT": "America/Anchorage",

    "HST": "Pacific/Honolulu",
    "HDT": "Pacific/Honolulu", // not commonly used; kept for leniency
    "HAWAII": "Pacific/Honolulu",
    "HONOLULU": "Pacific/Honolulu",

    // Canada-specific commonly requested zones
    "ATLANTIC": "America/Halifax",
    "AST": "America/Halifax", // ambiguous globally
    "ADT": "America/Halifax",
    "HALIFAX": "America/Halifax",

    "NEWFOUNDLAND": "America/St_Johns",
    "NST": "America/St_Johns",
    "NDT": "America/St_Johns",
    "STJOHNS": "America/St_Johns",
    "ST JOHNS": "America/St_Johns",
    "ST. JOHNS": "America/St_Johns",

    // Common US city aliases
    "NEW YORK": "America/New_York",
    "NYC": "America/New_York",
    "BOSTON": "America/New_York",
    "MIAMI": "America/New_York",

    "CHICAGO": "America/Chicago",
    "DALLAS": "America/Chicago",
    "HOUSTON": "America/Chicago",

    "DENVER": "America/Denver",
    "PHOENIX": "America/Phoenix",
    "ARIZONA": "America/Phoenix",

    "LOS ANGELES": "America/Los_Angeles",
    "LA": "America/Los_Angeles",
    "SEATTLE": "America/Los_Angeles",
    "SAN FRANCISCO": "America/Los_Angeles",
    "SF": "America/Los_Angeles",

    "ANCHORAGE": "America/Anchorage",

    // --- Mexico / Central America ---
    "MEXICO CITY": "America/Mexico_City",
    "CDMX": "America/Mexico_City",
    "COSTA RICA": "America/Costa_Rica",
    "GUATEMALA": "America/Guatemala",
    "PANAMA": "America/Panama",

    // --- South America ---
    "BRT": "America/Sao_Paulo",
    "BRASILIA": "America/Sao_Paulo",
    "SAO PAULO": "America/Sao_Paulo",
    "BUENOS AIRES": "America/Argentina/Buenos_Aires",
    "ARGENTINA": "America/Argentina/Buenos_Aires",
    "SANTIAGO": "America/Santiago",
    "CHILE": "America/Santiago",
    "BOGOTA": "America/Bogota",
    "COLOMBIA": "America/Bogota",
    "LIMA": "America/Lima",
    "PERU": "America/Lima",

    // --- UK / Ireland / Western Europe ---
    "LONDON": "Europe/London",
    "UK": "Europe/London",
    "UNITED KINGDOM": "Europe/London",
    "BRITAIN": "Europe/London",
    "BST": "Europe/London", // British Summer Time (seasonal)

    "IRELAND": "Europe/Dublin",
    "DUBLIN": "Europe/Dublin",

    "WEST": "Europe/Lisbon",
    "LISBON": "Europe/Lisbon",
    "PORTUGAL": "Europe/Lisbon",

    // --- Central Europe ---
    "CET": "Europe/Berlin",
    "CEST": "Europe/Berlin",
    "BERLIN": "Europe/Berlin",
    "GERMANY": "Europe/Berlin",

    "PARIS": "Europe/Paris",
    "FRANCE": "Europe/Paris",

    "MADRID": "Europe/Madrid",
    "SPAIN": "Europe/Madrid",

    "ROME": "Europe/Rome",
    "ITALY": "Europe/Rome",

    "AMSTERDAM": "Europe/Amsterdam",
    "NETHERLANDS": "Europe/Amsterdam",

    "BRUSSELS": "Europe/Brussels",
    "BELGIUM": "Europe/Brussels",

    "ZURICH": "Europe/Zurich",
    "SWITZERLAND": "Europe/Zurich",

    "VIENNA": "Europe/Vienna",
    "AUSTRIA": "Europe/Vienna",

    "STOCKHOLM": "Europe/Stockholm",
    "SWEDEN": "Europe/Stockholm",

    "OSLO": "Europe/Oslo",
    "NORWAY": "Europe/Oslo",

    "COPENHAGEN": "Europe/Copenhagen",
    "DENMARK": "Europe/Copenhagen",

    "WARSAW": "Europe/Warsaw",
    "POLAND": "Europe/Warsaw",

    // --- Eastern Europe / Russia ---
    "EET": "Europe/Athens",
    "EEST": "Europe/Athens",
    "ATHENS": "Europe/Athens",
    "GREECE": "Europe/Athens",

    "HELSINKI": "Europe/Helsinki",
    "FINLAND": "Europe/Helsinki",

    "BUCHAREST": "Europe/Bucharest",
    "ROMANIA": "Europe/Bucharest",

    "KYIV": "Europe/Kyiv",
    "KIEV": "Europe/Kyiv",
    "UKRAINE": "Europe/Kyiv",

    "MSK": "Europe/Moscow",
    "MOSCOW": "Europe/Moscow",
    "RUSSIA": "Europe/Moscow",

    // --- Middle East / Africa ---
    "ISTANBUL": "Europe/Istanbul",
    "TURKEY": "Europe/Istanbul",

    "JERUSALEM": "Asia/Jerusalem",
    "ISRAEL": "Asia/Jerusalem",
    "IDT": "Asia/Jerusalem",
    "ILT": "Asia/Jerusalem", // legacy alias

    "CAIRO": "Africa/Cairo",
    "EGYPT": "Africa/Cairo",
    "SAST": "Africa/Johannesburg",
    "SOUTH AFRICA": "Africa/Johannesburg",
    "JOHANNESBURG": "Africa/Johannesburg",
    "NAIROBI": "Africa/Nairobi",
    "KENYA": "Africa/Nairobi",
    "LAGOS": "Africa/Lagos",
    "NIGERIA": "Africa/Lagos",

    // Gulf
    "GST": "Asia/Dubai",
    "DUBAI": "Asia/Dubai",
    "UAE": "Asia/Dubai",
    "ABU DHABI": "Asia/Dubai",
    "QATAR": "Asia/Qatar",
    "DOHA": "Asia/Qatar",
    "KUWAIT": "Asia/Kuwait",
    "RIYADH": "Asia/Riyadh",
    "SAUDI": "Asia/Riyadh",

    // --- South Asia ---
    "INDIA": "Asia/Kolkata",
    // "IN": "Asia/Kolkata",
    "KOLKATA": "Asia/Kolkata",
    "DELHI": "Asia/Kolkata",
    "MUMBAI": "Asia/Kolkata",
    // "IST": "Asia/Kolkata", // ambiguous (Ireland/Israel/India)
    "PKT": "Asia/Karachi",
    "PAKISTAN": "Asia/Karachi",
    "KARACHI": "Asia/Karachi",
    "BSTBD": "Asia/Dhaka",
    "BANGLADESH": "Asia/Dhaka",
    "DHAKA": "Asia/Dhaka",
    "NPT": "Asia/Kathmandu",
    "NEPAL": "Asia/Kathmandu",
    "KATHMANDU": "Asia/Kathmandu",
    "SLST": "Asia/Colombo",
    "SRI LANKA": "Asia/Colombo",
    "COLOMBO": "Asia/Colombo",

    // --- East / Southeast Asia ---
    "CHINA": "Asia/Shanghai",
    "CN": "Asia/Shanghai",
    "BEIJING": "Asia/Shanghai",
    "SHANGHAI": "Asia/Shanghai",

    "TAIWAN": "Asia/Taipei",
    "TPE": "Asia/Taipei",
    "TAIPEI": "Asia/Taipei",

    "HKT": "Asia/Hong_Kong",
    "HONG KONG": "Asia/Hong_Kong",
    "HK": "Asia/Hong_Kong",

    "SGT": "Asia/Singapore",
    "SINGAPORE": "Asia/Singapore",

    "MYT": "Asia/Kuala_Lumpur",
    "MALAYSIA": "Asia/Kuala_Lumpur",
    "KUALA LUMPUR": "Asia/Kuala_Lumpur",

    "WIB": "Asia/Jakarta",
    "JAKARTA": "Asia/Jakarta",
    "INDONESIA": "Asia/Jakarta",

    "PHT": "Asia/Manila",
    "PHILIPPINES": "Asia/Manila",
    "MANILA": "Asia/Manila",

    "ICT": "Asia/Bangkok",
    "BANGKOK": "Asia/Bangkok",
    "THAILAND": "Asia/Bangkok",
    "VIETNAM": "Asia/Ho_Chi_Minh",
    "SAIGON": "Asia/Ho_Chi_Minh",
    "HO CHI MINH": "Asia/Ho_Chi_Minh",

    "KST": "Asia/Seoul",
    "KOREA": "Asia/Seoul",
    "SEOUL": "Asia/Seoul",

    "JST": "Asia/Tokyo",
    "JAPAN": "Asia/Tokyo",
    "TOKYO": "Asia/Tokyo",

    // --- Australia / New Zealand ---
    "AEST": "Australia/Sydney",
    "AEDT": "Australia/Sydney",
    "SYDNEY": "Australia/Sydney",
    "NSW": "Australia/Sydney",

    "AET": "Australia/Sydney", // common pseudo-abbrev

    "ACST": "Australia/Adelaide",
    "ACDT": "Australia/Adelaide",
    "ADELAIDE": "Australia/Adelaide",

    "AEST-BRISBANE": "Australia/Brisbane",
    "BRISBANE": "Australia/Brisbane",

    "AWST": "Australia/Perth",
    "PERTH": "Australia/Perth",

    "NZST": "Pacific/Auckland",
    "NZDT": "Pacific/Auckland",
    "NEW ZEALAND": "Pacific/Auckland",
    "AUCKLAND": "Pacific/Auckland"
};
