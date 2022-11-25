// To parse this data:
//
//   import { Convert, JobsList } from "./file";
//
//   const jobsList = Convert.toJobsList(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface JobsList {
  posts?:      Post[];
  pageCount?:  number;
  page?:       number;
  totalItems?: number;
  facetList?:  FacetList;
}

export interface FacetList {
  contractType?: { [key: string]: ContractType };
  price?:        { [key: string]: ContractType };
}

export interface ContractType {
  value?: number;
  label?: string;
  count?: number;
}

export interface Post {
  maps?:                 number;
  socialMedia?:          number;
  utmMedium?:            null;
  createdAt?:            AtedAt;
  slug?:                 string;
  form?:                 string;
  projectContacts?:      string[];
  otherApis?:            number;
  status?:               number;
  updatedAt?:            AtedAt;
  skills?:               string[];
  usersRate?:            string[];
  itemWeek?:             number;
  similar?:              string;
  agree?:                boolean;
  itemYear?:             string;
  active?:               boolean;
  itemDay?:              string;
  paymentProcessor?:     number;
  projectContactsCount?: number;
  utmSource?:            null;
  title?:                string;
  older?:                boolean;
  phone?:                string;
  cloudStorage?:         number;
  price?:                Price;
  id?:                   string;
  contentStatus?:        number;
  code?:                 number;
  resumo?:               string;
  error?:                string;
  toxicity?:             Toxicity;
  userOwner?:            UserOwner;
  done?:                 boolean;
  rate?:                 Rate;
  name?:                 string;
  backend?:              number;
  withPayment?:          boolean;
  userOwnerUid?:         string;
  projectType?:          string;
  startType?:            string;
  itemMonth?:            ItemMonth;
  stepProject?:          number;
  userUid?:              string;
  new?:                  boolean;
  points?:               number;
  proposalsCount?:       number;
  userProposals?:        string[];
}

export interface AtedAt {
  seconds?:     number;
  nanoseconds?: number;
}

export enum ItemMonth {
  The092022 = "09-2022",
  The102022 = "10-2022",
  The112022 = "11-2022",
}

export interface Price {
  price?:        number;
  contractType?: number;
  pricePerHour?: number | string;
}

export interface Rate {
  value?:    number;
  negative?: number;
  positive?: number;
}

export interface Toxicity {
  toxicityTitle?:  number;
  toxicityResumo?: number;
}

export interface UserOwner {
  uid?:          string;
  imageProfile?: string;
  name?:         string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toJobsList(json: string): JobsList {
      return cast(JSON.parse(json), r("JobsList"));
  }

  public static jobsListToJson(value: JobsList): string {
      return JSON.stringify(uncast(value, r("JobsList")), null, 2);
  }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
  if (key) {
      throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
  }
  throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`, );
}

function jsonToJSProps(typ: any): any {
  if (typ.jsonToJS === undefined) {
      const map: any = {};
      typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
      typ.jsonToJS = map;
  }
  return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
  if (typ.jsToJSON === undefined) {
      const map: any = {};
      typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
      typ.jsToJSON = map;
  }
  return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
  function transformPrimitive(typ: string, val: any): any {
      if (typeof typ === typeof val) return val;
      return invalidValue(typ, val, key);
  }

  function transformUnion(typs: any[], val: any): any {
      // val must validate against one typ in typs
      const l = typs.length;
      for (let i = 0; i < l; i++) {
          const typ = typs[i];
          try {
              return transform(val, typ, getProps);
          } catch (_) {}
      }
      return invalidValue(typs, val);
  }

  function transformEnum(cases: string[], val: any): any {
      if (cases.indexOf(val) !== -1) return val;
      return invalidValue(cases, val);
  }

  function transformArray(typ: any, val: any): any {
      // val must be an array with no invalid elements
      if (!Array.isArray(val)) return invalidValue("array", val);
      return val.map(el => transform(el, typ, getProps));
  }

  function transformDate(val: any): any {
      if (val === null) {
          return null;
      }
      const d = new Date(val);
      if (isNaN(d.valueOf())) {
          return invalidValue("Date", val);
      }
      return d;
  }

  function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
      if (val === null || typeof val !== "object" || Array.isArray(val)) {
          return invalidValue("object", val);
      }
      const result: any = {};
      Object.getOwnPropertyNames(props).forEach(key => {
          const prop = props[key];
          const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
          result[prop.key] = transform(v, prop.typ, getProps, prop.key);
      });
      Object.getOwnPropertyNames(val).forEach(key => {
          if (!Object.prototype.hasOwnProperty.call(props, key)) {
              result[key] = transform(val[key], additional, getProps, key);
          }
      });
      return result;
  }

  if (typ === "any") return val;
  if (typ === null) {
      if (val === null) return val;
      return invalidValue(typ, val);
  }
  if (typ === false) return invalidValue(typ, val);
  while (typeof typ === "object" && typ.ref !== undefined) {
      typ = typeMap[typ.ref];
  }
  if (Array.isArray(typ)) return transformEnum(typ, val);
  if (typeof typ === "object") {
      return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
          : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
          : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
          : invalidValue(typ, val);
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== "number") return transformDate(val);
  return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
  return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
  return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
  return { arrayItems: typ };
}

function u(...typs: any[]) {
  return { unionMembers: typs };
}

function o(props: any[], additional: any) {
  return { props, additional };
}

function m(additional: any) {
  return { props: [], additional };
}

function r(name: string) {
  return { ref: name };
}

const typeMap: any = {
  "JobsList": o([
      { json: "posts", js: "posts", typ: u(undefined, a(r("Post"))) },
      { json: "pageCount", js: "pageCount", typ: u(undefined, 0) },
      { json: "page", js: "page", typ: u(undefined, 0) },
      { json: "totalItems", js: "totalItems", typ: u(undefined, 0) },
      { json: "facet_list", js: "facetList", typ: u(undefined, r("FacetList")) },
  ], false),
  "FacetList": o([
      { json: "contract_type", js: "contractType", typ: u(undefined, m(r("ContractType"))) },
      { json: "price", js: "price", typ: u(undefined, m(r("ContractType"))) },
  ], false),
  "ContractType": o([
      { json: "value", js: "value", typ: u(undefined, 0) },
      { json: "label", js: "label", typ: u(undefined, "") },
      { json: "count", js: "count", typ: u(undefined, 0) },
  ], false),
  "Post": o([
      { json: "maps", js: "maps", typ: u(undefined, 0) },
      { json: "social_media", js: "socialMedia", typ: u(undefined, 0) },
      { json: "utm_medium", js: "utmMedium", typ: u(undefined, null) },
      { json: "createdAt", js: "createdAt", typ: u(undefined, r("AtedAt")) },
      { json: "slug", js: "slug", typ: u(undefined, "") },
      { json: "form", js: "form", typ: u(undefined, "") },
      { json: "project_contacts", js: "projectContacts", typ: u(undefined, a("")) },
      { json: "other_apis", js: "otherApis", typ: u(undefined, 0) },
      { json: "status", js: "status", typ: u(undefined, 0) },
      { json: "updatedAt", js: "updatedAt", typ: u(undefined, r("AtedAt")) },
      { json: "skills", js: "skills", typ: u(undefined, a("")) },
      { json: "users_rate", js: "usersRate", typ: u(undefined, a("")) },
      { json: "item_week", js: "itemWeek", typ: u(undefined, 0) },
      { json: "similar", js: "similar", typ: u(undefined, "") },
      { json: "agree", js: "agree", typ: u(undefined, true) },
      { json: "item_year", js: "itemYear", typ: u(undefined, "") },
      { json: "active", js: "active", typ: u(undefined, true) },
      { json: "item_day", js: "itemDay", typ: u(undefined, "") },
      { json: "payment_processor", js: "paymentProcessor", typ: u(undefined, 0) },
      { json: "project_contacts_count", js: "projectContactsCount", typ: u(undefined, 0) },
      { json: "utm_source", js: "utmSource", typ: u(undefined, null) },
      { json: "title", js: "title", typ: u(undefined, "") },
      { json: "older", js: "older", typ: u(undefined, true) },
      { json: "phone", js: "phone", typ: u(undefined, "") },
      { json: "cloud_storage", js: "cloudStorage", typ: u(undefined, 0) },
      { json: "price", js: "price", typ: u(undefined, r("Price")) },
      { json: "id", js: "id", typ: u(undefined, "") },
      { json: "content_status", js: "contentStatus", typ: u(undefined, 0) },
      { json: "code", js: "code", typ: u(undefined, 0) },
      { json: "resumo", js: "resumo", typ: u(undefined, "") },
      { json: "error", js: "error", typ: u(undefined, "") },
      { json: "toxicity", js: "toxicity", typ: u(undefined, r("Toxicity")) },
      { json: "user_owner", js: "userOwner", typ: u(undefined, r("UserOwner")) },
      { json: "done", js: "done", typ: u(undefined, true) },
      { json: "rate", js: "rate", typ: u(undefined, r("Rate")) },
      { json: "name", js: "name", typ: u(undefined, "") },
      { json: "backend", js: "backend", typ: u(undefined, 0) },
      { json: "with_payment", js: "withPayment", typ: u(undefined, true) },
      { json: "user_owner_uid", js: "userOwnerUid", typ: u(undefined, "") },
      { json: "project_type", js: "projectType", typ: u(undefined, "") },
      { json: "start_type", js: "startType", typ: u(undefined, "") },
      { json: "item_month", js: "itemMonth", typ: u(undefined, r("ItemMonth")) },
      { json: "step_project", js: "stepProject", typ: u(undefined, 0) },
      { json: "user_uid", js: "userUid", typ: u(undefined, "") },
      { json: "new", js: "new", typ: u(undefined, true) },
      { json: "points", js: "points", typ: u(undefined, 0) },
      { json: "proposals_count", js: "proposalsCount", typ: u(undefined, 0) },
      { json: "user_proposals", js: "userProposals", typ: u(undefined, a("")) },
  ], false),
  "AtedAt": o([
      { json: "_seconds", js: "seconds", typ: u(undefined, 0) },
      { json: "_nanoseconds", js: "nanoseconds", typ: u(undefined, 0) },
  ], false),
  "Price": o([
      { json: "price", js: "price", typ: u(undefined, 0) },
      { json: "contract_type", js: "contractType", typ: u(undefined, 0) },
      { json: "price_per_hour", js: "pricePerHour", typ: u(undefined, u(0, "")) },
  ], false),
  "Rate": o([
      { json: "value", js: "value", typ: u(undefined, 0) },
      { json: "negative", js: "negative", typ: u(undefined, 0) },
      { json: "positive", js: "positive", typ: u(undefined, 0) },
  ], false),
  "Toxicity": o([
      { json: "toxicity_title", js: "toxicityTitle", typ: u(undefined, 3.14) },
      { json: "toxicity_resumo", js: "toxicityResumo", typ: u(undefined, 3.14) },
  ], false),
  "UserOwner": o([
      { json: "uid", js: "uid", typ: u(undefined, "") },
      { json: "image_profile", js: "imageProfile", typ: u(undefined, "") },
      { json: "name", js: "name", typ: u(undefined, "") },
  ], false),
  "ItemMonth": [
      "09-2022",
      "10-2022",
      "11-2022",
  ],
};
