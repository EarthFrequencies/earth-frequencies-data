# Earth Frequencies

This is a collection of machine parasable data files, intended for use in an
amateur context, that describe radio frequency allocations and channels.

Currently this is an experiment into how best the data can be represented
for use in applications. For example, for SDR applications that can select
an appropriate data representation, loading the appropiate module, based
on what it 'knows' should be in the frequency it is scanning.

This should NOT be considered a primary source for this information and you
should not assume the data here is 100% correct (data quality is always a
challenge). You should always check official sources for accurate data
about allocation and usage requirements.

Also remember, that any radio transmission requires an appropriate license
and in all cases you should be aware of local regulation of the air waves.

If you find errors, please open a bug report in the project's issue tracker,
or provide a pull-request with the fix.

## Converter
Right now, the converter used for converting the data is found in `python/`.

You will first need to install the necessary libraries.
```bash
$ cd python
$ pip install .
```

To run:
```bash
./scripts/run_converter.sh
```


## Contributions

Contributions are welcome and are appreciated.

## License

See [License file](./LICENSE.md)

## References

The main starting point of any radio spectrum allocation is the [ITU](https://www.itu.int/en/mediacentre/backgrounders/Pages/itu-r-managing-the-radio-frequency-spectrum-for-the-world.aspx) and then
it is broken down into regional regulators.

It should be noted that source data may have inaccuries or be out of date, so
this should be verified and taken into account.

## Earth Frequencies Viewer

Given this project is focusing purely on the data, the viewer that was
once part of this project has been moved out to its own project:

https://github.com/EarthFrequencies/earth-frequencies-webui

