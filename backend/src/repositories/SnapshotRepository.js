import Entry from '../types/Entry';

export default class SnapshotRepository {
  constructor(db) {
    this.model = db.collection('snapshots');
  }

  /**
   * @param {string} iso3
   * @param {Date} date
   * @returns {Promise<Array<Entry>>}
   */
  getByTerritoryAndDate(iso, date) {
    const query = {
      start_date: { $lte: date },
      end_date: { $gte: date },
    };
    this.applyIsoFilter(iso, query);
    return this.model.find(query);
  }

  /** @private */
  applyIsoFilter(iso, query) {
    if (iso.length == 2) {
      query.iso2 = iso;
    } else {
      query.iso3 = iso;
    }
  }

  /**
   *
   * @param {string} iso
   * @param {Date} startDate
   * @param {Date} endDate
   */
  getByTerritoryAndDateRange(iso, startDate, endDate) {
    const query = {
      start_date: { $lte: endDate },
      end_date: { $gte: startDate },
    };
    this.applyIsoFilter(iso, query);
    return this.model.find(query);
  }



  /**
   *
   * @param {Date} date
   */
  getByDateGroupByCountries(date) {
    return this.model.aggregate([
      {
        $match: {
          start_date: { $lte: date },
          end_date: { $gte: date },
        },
      },
      {
        $group: {
          _id: '$iso3',
          ranges: { $push: '$$ROOT' },
        },
      },
    ]);
  }

  /**
   * 
   * @param {Date} startDate 
   * @param {Date} endDate 
   */
  getByDateRangeGroupByCountries(startDate, endDate) {
    return this.model.aggregate([
      {
        $match: {
          start_date: { $lte: endDate },
          end_date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$iso3',
          ranges: { $push: '$$ROOT' },
        },
      },
    ]);
  }

  /**
   *
   * @param {string} measureLabel
   * @param {Date} date
   */
  getByMeasureAndDate(measureLabel, date) {
    return this.model.find({
      'measures.label': measureLabel,
      start_date: { $lte: date },
      end_date: { $gte: date },
    });
  }

  /**
   *
   * @param {*} snaphot
   */
  insert(snaphot) {
    return this.model.insert(snaphot);
  }

  /**
   *
   * @param {[]} snaphot
   */
  insertMany(snaphots) {
    return this.model.insertMany(snaphots);
  }

  insertManyOrUpdate(snapshots) {
    return snapshots.map((s) => {
      return this.model.update(
        {
          unique_id: s.unique_id,
          start_date: s.start_date,
          end_date: s.end_date,
        },
        s,
        { upsert: true }
      );
    });
  }

  clear() {
    return this.model.remove();
  }
}