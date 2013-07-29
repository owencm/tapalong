//
//  ActivitesViewController.m
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "ActivitesViewController.h"
#import "ActivityTableCell.h"
#import <RestKit/RestKit.h>
#import "Activity.h"

@interface ActivitesViewController ()

@end

@implementation ActivitesViewController

- (id)initWithStyle:(UITableViewStyle)style
{
    self = [super initWithStyle:style];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];

    self.activities = [[NSArray alloc] init];
    
    [self loadActivities];
    
    // Uncomment the following line to preserve selection between presentations.
    // self.clearsSelectionOnViewWillAppear = NO;
 
    // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
    // self.navigationItem.rightBarButtonItem = self.editButtonItem;
}

- (void)loadActivities
{
    RKObjectMapping *activityMapping = [RKObjectMapping mappingForClass:[Activity class]];
    [activityMapping addAttributeMappingsFromDictionary:@{
     @"title": @"title",
     @"start_time": @"start_time",
     @"location": @"location",
     @"max_attendees": @"max_attendees",
     @"description": @"description"
    }];
    
    RKResponseDescriptor *responseDescriptor = [RKResponseDescriptor responseDescriptorWithMapping:activityMapping pathPattern:nil keyPath:@"activity" statusCodes:RKStatusCodeIndexSetForClass(RKStatusCodeClassSuccessful)];
    
    NSURL *URL = [NSURL URLWithString:@"http://127.0.0.1:8000/activities/1/"];
    NSURLRequest *request = [NSURLRequest requestWithURL:URL];
    RKObjectRequestOperation *objectRequestOperation = [[RKObjectRequestOperation alloc] initWithRequest:request responseDescriptors:@[ responseDescriptor ]];
    [objectRequestOperation setCompletionBlockWithSuccess:^(RKObjectRequestOperation *operation, RKMappingResult *mappingResult) {
//        RKLogInfo(@"Load collection of Activities: %@", mappingResult.array);
        self.activities = mappingResult.array;
        [self.tableView reloadData];
    } failure:^(RKObjectRequestOperation *operation, NSError *error) {
        RKLogError(@"Operation failed with error: %@", error);
    }];
    
    [objectRequestOperation start];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    return [self.activities count];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *CellIdentifier = @"Cell Identifier";
    ActivityTableCell *cell = (ActivityTableCell *)[tableView dequeueReusableCellWithIdentifier:CellIdentifier];
    if (cell == nil)
    {
        NSArray *nib = [[NSBundle mainBundle] loadNibNamed:@"ActivityTableCell" owner:self options:nil];
        cell = [nib objectAtIndex:0];
    }
    
    Activity *activity = [self.activities objectAtIndex:indexPath.row];
    NSString *titleString = [[activity title] capitalizedString];
    NSString *descriptionString = [activity description];
    NSString *locationString = [activity location];
    NSString *dateString = @" tomorrow at 7pm";
    NSString *userNameString = @"Owen Campbell-Moore";
    [self setTextInCell:cell titleString:titleString userNameString:userNameString descriptionString:descriptionString locationString:locationString dateString:dateString];
    
    return cell;
}

- (void)setTextInCell:(ActivityTableCell *)cell titleString:(NSString *)titleString userNameString:(NSString *)userNameString descriptionString:(NSString *)descriptionString locationString:(NSString *)locationString dateString:(NSString *)dateString {
    
    cell.activityLabel.attributedText = [self getAttributedActivity:userNameString titleString:titleString dateString:dateString];
    cell.descriptionLabel.text = descriptionString;
    cell.locationLabel.text = [@"Location: " stringByAppendingString:locationString];
    
}

-(NSMutableAttributedString *)getAttributedActivity:(NSString *)userNameString titleString:(NSString *)titleString dateString:(NSString *)dateString
{
    NSString *joinedString = [[[userNameString stringByAppendingString:@" is "] stringByAppendingString:titleString] stringByAppendingString:dateString];
    
    // Define general attributes for the entire String
    NSDictionary *attribs = @{};
    
    // Define preset styles we will use
    UIFont *largeString = [UIFont fontWithName:@"Roboto" size:16];
    UIFont *smallString = [UIFont fontWithName:@"Roboto-Light" size:14];
    UIColor *veryDarkGrey = [UIColor colorWithRed:0.1 green:0.1 blue:0.1 alpha:1];
    UIColor *lessDarkGrey = [UIColor colorWithRed:0.2 green:0.2 blue:0.2 alpha:1];
    NSDictionary *largeStringAttributes = @{NSFontAttributeName: largeString,
                                         NSForegroundColorAttributeName: veryDarkGrey};
    NSDictionary *smallStringAttributes = @{NSFontAttributeName: smallString,
                                          NSForegroundColorAttributeName: lessDarkGrey};
    
    NSMutableAttributedString *attributedString =
    [[NSMutableAttributedString alloc] initWithString:joinedString
                                           attributes:attribs];
    NSRange userNameRange = {0, [userNameString length]};
    NSRange isRange = {[userNameString length], 4};
    NSRange titleRange = {[userNameString length]+4, [titleString length]};
    NSRange dateRange = {[userNameString length]+4+[titleString length], [dateString length]};
    [attributedString setAttributes:largeStringAttributes range:userNameRange];
    [attributedString setAttributes:smallStringAttributes range:isRange];
    [attributedString setAttributes:largeStringAttributes range:titleRange];
    [attributedString setAttributes:smallStringAttributes range:dateRange];
    
    CGRect size = [attributedString boundingRectWithSize: CGSizeMake(250, 0.0) options:NSStringDrawingUsesDeviceMetrics context:nil];
    
    NSLog(@"%@", NSStringFromCGRect(size));
    
    return attributedString;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (self.selectedCell && indexPath.row == self.selectedCell.row) {
        return 150;
    } else {
        return 86;
    }
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    self.selectedCell = indexPath;
//    ActivityTableCell *cell = (ActivityTableCell *)[tableView cellForRowAtIndexPath:indexPath];
    [tableView beginUpdates];
    [tableView endUpdates];
}

-(void)tableView:(UITableView *)tableView didDeselectRowAtIndexPath:(NSIndexPath *)indexPath {
    self.selectedCell = nil;
//    ActivityTableCell *cell = (ActivityTableCell *)[tableView cellForRowAtIndexPath:indexPath];
    [tableView beginUpdates];
    [tableView endUpdates];
    //Displaying and hiding items is managed by the cell itself
}

- (void)tableView:(UITableView *)tableView willDisplayCell:(UITableViewCell *)cell forRowAtIndexPath:(NSIndexPath *)indexPath
{
    cell.backgroundColor = [UIColor colorWithRed:0.94 green:0.94 blue:0.94 alpha:1];
}

@end
